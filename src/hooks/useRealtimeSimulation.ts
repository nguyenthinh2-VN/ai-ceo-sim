'use client';

// ============================================================
// useRealtimeSimulation.ts — WebSocket realtime + polling fallback
// Nguồn dữ liệu duy nhất cho trang chính.
//
// Luồng hoạt động:
//   1. Có NEXT_PUBLIC_SUPABASE_ANON_KEY  -> mở WebSocket tới Supabase Realtime.
//      Server ghi tick mới -> Postgres phát event -> trình duyệt nhận < 100ms.
//   2. Thiếu key, mất mạng, hoặc channel lỗi -> tự hạ cấp sang polling 5s.
//   3. Kết nối lại được -> tự nâng cấp về WebSocket, không cần F5.
//
// Hook này KHÔNG ghi dữ liệu. Web khán giả chỉ xem.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { GameState } from '@/lib/types';
import { getDemoState } from '@/lib/mock-data';
import {
  getBrowserRealtimeClient,
  isRealtimeConfigured,
  REALTIME_CHANNEL,
  TICKS_TABLE,
  LIVES_TABLE,
} from '@/lib/realtime/supabase-realtime';

export type ConnectionStatus = 'connecting' | 'connected' | 'fallback_polling';

export interface RealtimeEvent {
  /** 'tick' = AI vừa có quyết định mới; 'life' = đời AI đổi trạng thái. */
  type: 'tick' | 'life';
  at: Date;
}

export interface UseRealtimeSimulationResult {
  state: GameState | null;
  connectionStatus: ConnectionStatus;
  lastSyncTime: Date | null;
  /** Sự kiện realtime gần nhất — dùng để bắn toast cho người xem. */
  lastEvent: RealtimeEvent | null;
  /** Ghi đè state cục bộ (dùng sau khi tạo AI mới, hoặc khi API chết hẳn). */
  applyState: (next: GameState) => void;
}

/** Nhịp polling khi không có WebSocket. */
const POLL_INTERVAL_MS = 5_000;

/**
 * Sau ngần này không nhận được gì trong lúc đang "connected", hook tự
 * gọi 1 request HTTP để bù — phòng trường hợp WebSocket treo im lặng
 * (mạng chập chờn) mà không hề báo lỗi.
 */
const STALE_SYNC_MS = 30_000;

/** Hình dạng tối thiểu của payload postgres_changes mà hook thực sự dùng. */
interface TickChangePayload {
  new?: { state?: GameState };
}

/**
 * Trạng thái kết nối ban đầu, suy ra từ cấu hình env — KHÔNG đặt trong
 * effect. Cách này tránh gọi setState đồng bộ lúc mount (React 19 coi là
 * lỗi) và giữ server/client render giống nhau nên không lệch hydration:
 * cả hai đều đọc cùng giá trị NEXT_PUBLIC_* đã được nhúng lúc build.
 */
function initialConnectionStatus(): ConnectionStatus {
  return isRealtimeConfigured() ? 'connecting' : 'fallback_polling';
}

export function useRealtimeSimulation(): UseRealtimeSimulationResult {
  const [state, setState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(initialConnectionStatus);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  // Mốc nhận message gần nhất, dùng cho heartbeat phát hiện "WebSocket còn
  // mở nhưng im lặng". Khởi tạo 0 rồi gán trong effect: Date.now() lúc
  // render bị Next.js 16 coi là giá trị bất ổn định, sẽ hỏng prerender.
  const lastMessageAtRef = useRef<number>(0);
  useEffect(() => {
    lastMessageAtRef.current = Date.now();
  }, []);

  /**
   * Tải state từ API. Dùng chung cho lần load đầu, polling, và resync.
   * Trả về `null` nếu thất bại để người gọi quyết định có dùng demo hay không.
   */
  const fetchState = useCallback(async (): Promise<GameState | null> => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.state) throw new Error('Response thiếu trường state');

      setState(data.state);
      setLastSyncTime(new Date());
      lastMessageAtRef.current = Date.now();
      return data.state;
    } catch (err) {
      console.warn('[Realtime] Không tải được state từ API:', err);
      return null;
    }
  }, []);

  const applyState = useCallback((next: GameState) => {
    setState(next);
    setLastSyncTime(new Date());
  }, []);

  // ------------------------------------------------------------------
  // Hiệu ứng 1: tải state lần đầu
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await fetchState();
      // API chết ngay từ đầu (chạy tĩnh không có server): vẫn phải cho
      // người xem thấy giao diện thay vì màn hình quay mãi.
      if (!loaded && !cancelled) {
        setState(getDemoState());
        setLastSyncTime(new Date());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchState]);

  // ------------------------------------------------------------------
  // Hiệu ứng 2: WebSocket Realtime (có thì dùng, không có thì bỏ qua)
  // ------------------------------------------------------------------
  useEffect(() => {
    const client = getBrowserRealtimeClient();
    // Chưa cấu hình -> trạng thái đã là 'fallback_polling' từ lúc khởi tạo,
    // và hiệu ứng 3 sẽ lo phần polling.
    if (!client) return;

    const channel: RealtimeChannel = client
      .channel(REALTIME_CHANNEL)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TICKS_TABLE },
        (payload: TickChangePayload) => {
          lastMessageAtRef.current = Date.now();
          setConnectionStatus('connected');

          // INSERT luôn kèm nguyên bản ghi, nên không cần gọi thêm HTTP.
          // Đây là đường đi nhanh: dữ liệu tới thẳng từ WebSocket.
          if (payload.new?.state) {
            setState(payload.new.state);
            setLastSyncTime(new Date());
          } else {
            void fetchState();
          }

          setLastEvent({ type: 'tick', at: new Date() });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: LIVES_TABLE },
        () => {
          lastMessageAtRef.current = Date.now();
          // lives chỉ chứa metadata (tên, trạng thái sống/phá sản), không
          // chứa GameState — phải hỏi lại API để lấy state đầy đủ.
          void fetchState();
          setLastEvent({ type: 'life', at: new Date() });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          lastMessageAtRef.current = Date.now();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Supabase sẽ tự thử lại; trong lúc đó polling giữ web luôn sống.
          console.warn(`[Realtime] Channel ${status}, chuyển sang polling.`);
          setConnectionStatus('fallback_polling');
        } else if (status === 'CLOSED') {
          setConnectionStatus('fallback_polling');
        }
      });

    return () => {
      // Bắt buộc: không gỡ channel sẽ rò rỉ kết nối qua mỗi lần remount.
      void client.removeChannel(channel);
    };
  }, [fetchState]);

  // ------------------------------------------------------------------
  // Hiệu ứng 3: Polling dự phòng — chỉ chạy khi KHÔNG có WebSocket sống
  // ------------------------------------------------------------------
  useEffect(() => {
    if (connectionStatus === 'connected') return;

    const timer = setInterval(() => {
      void fetchState();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [connectionStatus, fetchState]);

  // ------------------------------------------------------------------
  // Hiệu ứng 4: Heartbeat — WebSocket "sống" nhưng im lặng quá lâu
  // ------------------------------------------------------------------
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const timer = setInterval(() => {
      if (Date.now() - lastMessageAtRef.current > STALE_SYNC_MS) {
        void fetchState();
      }
    }, STALE_SYNC_MS);

    return () => clearInterval(timer);
  }, [connectionStatus, fetchState]);

  return {
    state,
    connectionStatus,
    lastSyncTime,
    lastEvent,
    applyState,
  };
}