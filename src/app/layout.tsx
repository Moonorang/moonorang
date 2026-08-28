import type { Metadata } from 'next';

import { displayFont, notoSansKr } from '@/shared/fonts';
import '@/shared/styles/globals.css';
import { AppHeader } from '@/app/_header';

export const metadata: Metadata = {
  title: '무너랑',
  description: '챗봇으로 요금제 상담부터 가입까지 한 번에',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
