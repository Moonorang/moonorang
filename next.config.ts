import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * Next 는 개발 서버의 dev 전용 자산·엔드포인트에 대한 교차 출처 요청을 기본으로
   * 막는다. 그래서 같은 네트워크의 폰에서 http://<사설 IP>:3000 으로 열면 HTML 은
   * 내려오는데 JS 청크가 403 이 되어, 화면은 보이지만 아무것도 눌리지 않는다.
   * 모바일 실기기 확인을 하려면 그 출처를 여기 적어야 한다.
   *
   * 개발 모드에서만 쓰이는 설정이라 배포에는 영향이 없다.
   * 네트워크가 바뀌어 IP 대역이 달라지면 여기에 한 줄 더 추가하면 된다.
   */
  allowedDevOrigins: ['10.4.2.*', '192.168.*.*', '172.30.*.*'],
};

export default nextConfig;
