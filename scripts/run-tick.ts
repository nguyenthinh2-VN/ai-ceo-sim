import fs from 'fs';
import http from 'http';

const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const secret = (env.match(/AI_TICK_SECRET=(.+)/) || [])[1]?.trim();

if (!secret) {
  console.error('❌ Không tìm thấy AI_TICK_SECRET trong file .env');
  process.exit(1);
}

console.log('🚀 Đang gửi yêu cầu kích hoạt 1 lượt Tick AI CEO tới http://localhost:3000/api/ai-tick ...');

const postData = JSON.stringify({ forceDecision: true });

const req = http.request(
  'http://localhost:3000/api/ai-tick',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log('\n✅ [THÀNH CÔNG] Lượt Tick đã thực thi:');
          console.log(`- Kế hoạch: ${json.tick?.plan}`);
          console.log(`- Lý do: ${json.tick?.reason}`);
          console.log(`- Hành động:`, json.tick?.actions);
          console.log(`- Tiền mặt hiện tại: ${json.state?.tienMat?.toLocaleString('vi-VN')}đ`);
          console.log(`- Chế độ: ${json.isDemo ? 'Demo luật tạm' : 'AI LLM thật 100%'}\n`);
        } else {
          console.error('❌ Lỗi khi thực thi Tick:', json);
        }
      } catch (err) {
        console.error('❌ Phản hồi không phải JSON:', data);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('❌ Kết nối thất bại. Hãy chắc chắn Next.js server đang chạy trên port 3000:', err.message);
});

req.write(postData);
req.end();
