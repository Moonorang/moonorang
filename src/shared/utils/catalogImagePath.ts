// 목록 카드 이미지가 놓인 public 경로 (DB 에는 파일명만 저장돼 있다).
// 구독 상품·멤버십(features/catalog)과 채팅 카드(features/chat) 둘 다 참조해서
// 도메인 지식이 없는 shared에 둔다 - 특정 entity 하나에 속한 값이 아니다.
export const CATALOG_IMAGE_BASE_PATH = '/images/catalog';
