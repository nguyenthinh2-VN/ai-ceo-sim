import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI CEO Simulator — AI tự làm CEO công ty IT",
  description: "Xem AI tự quyết định mọi thứ: thuê người, nhận hợp đồng, ngủ, làm việc, phá sản. Bạn chỉ xem, không can thiệp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function clean(el) {
                  if (el && el.removeAttribute) {
                    if (el.hasAttribute('bis_skin_checked')) el.removeAttribute('bis_skin_checked');
                    if (el.hasAttribute('bis_register')) el.removeAttribute('bis_register');
                  }
                }
                const observer = new MutationObserver(function(mutations) {
                  for (let i = 0; i < mutations.length; i++) {
                    const m = mutations[i];
                    if (m.type === 'attributes') {
                      clean(m.target);
                    } else if (m.type === 'childList') {
                      for (let j = 0; j < m.addedNodes.length; j++) {
                        const node = m.addedNodes[j];
                        if (node && node.nodeType === 1) {
                          clean(node);
                          const sub = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked], [bis_register]') : [];
                          for (let k = 0; k < sub.length; k++) clean(sub[k]);
                        }
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  attributes: true,
                  childList: true,
                  subtree: true,
                  attributeFilter: ['bis_skin_checked', 'bis_register']
                });
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
