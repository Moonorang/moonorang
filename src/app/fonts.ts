import { Noto_Sans_KR } from 'next/font/google';
import localFont from 'next/font/local';

// 본문 기본 폰트
export const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

// 로고, 포인트 폰트
export const displayFont = localFont({
  src: './fonts/Hakgyoansim-Dunggeunmiso-B.woff',
  variable: '--font-display-local',
  weight: '600',
  display: 'swap',
});
