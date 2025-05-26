import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZBiliMusic",
  description: "Your music in one click",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
