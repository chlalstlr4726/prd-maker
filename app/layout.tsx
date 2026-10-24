import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist에는 한글 글꼴이 없어서 한글만 Noto Sans KR로 보여 준다 (DESIGN.md 2번)
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "PRD 메이커",
  description: "아이디어 한 줄로 해커톤용 PRD를 만든다",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex h-11 w-full max-w-[1088px] items-center gap-3 px-4 text-xs">
            <span className="font-semibold">PRD 메이커</span>
            <span className="text-muted">아이디어 한 줄로 해커톤용 PRD</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
