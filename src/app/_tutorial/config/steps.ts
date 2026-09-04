// TUTORIAL-002: 단계별 문구. 실제 화면 요소(헤더 아이콘, + 버튼)를 흉내 낸 그림은
// ui/visuals 쪽에 따로 두고, 여기는 코드를 안 고치고도 바꿀 수 있는 문구만 담는다.

export interface TutorialStepContent {
  id: 'welcome' | 'header' | 'plus' | 'chatbot';
  title: string;
  description: string;
  /** 마지막 단계만 '시작하기'로 달라서 여기서 같이 관리한다 */
  ctaLabel: string;
}

export const TUTORIAL_STEPS: TutorialStepContent[] = [
  {
    id: 'welcome',
    title: '안녕하세요, 무너예요!',
    description:
      '요금제 상담부터 가입까지, 채팅 한 번이면 충분해요.\n시작하기 전에 잠깐 둘러볼까요?',
    ctaLabel: '다음',
  },
  {
    id: 'header',
    title: '상단 아이콘 세 가지',
    description:
      '마이페이지, 상품·혜택 둘러보기, 로그인까지 - 대화 중에도 언제든 여기서 바로 이동할 수 있어요.',
    ctaLabel: '다음',
  },
  {
    id: 'plus',
    title: '입력창 옆 + 버튼',
    description:
      '대화 초기화, 취미 성향 검사, 관심사 알아보기 까지 이 버튼 하나로 이용할 수 있어요.',
    ctaLabel: '다음',
  },
  {
    id: 'chatbot',
    title: '무너에게 물어보세요',
    description:
      '사용량과 예산만 알려주시면, 딱 맞는 요금제를 찾아서 가입까지 이어드려요.',
    ctaLabel: '시작하기',
  },
];
