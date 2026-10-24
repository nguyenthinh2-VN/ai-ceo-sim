import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI CEO Simulator — AI tự làm CEO công ty IT",
  description: "Xem AI tự quyết định mọi thứ: thuê người, nhận hợp đồng, ngủ, làm việc, phá sản. Bạn chỉ xem, không can thiệp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
