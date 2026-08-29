import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성향 매칭",
  description: "설문으로 성향이 맞는 사람을 찾아드립니다",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e11d63",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        }}
      >
        {/* 모바일 우선 — 넓은 화면에서도 폰 너비로 가운데 정렬 */}
        <div className="w-full max-w-[480px] mx-auto flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
