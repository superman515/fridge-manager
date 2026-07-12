import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "냉장고 관리",
  description: "가족과 함께 관리하는 냉장고 유통기한 트래커",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
