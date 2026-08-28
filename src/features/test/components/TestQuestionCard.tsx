import QuestionCard from '@/shared/ui/QuestionCard';

import { TEST_QUESTIONS } from '@/features/test/data/questions';

interface TestQuestionCardProps {
  currentIndex: number;
  selectedValue: number | null;
  onSelect: (value: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
}

/**
 * CARD-008~011: 대화 안에 카드로 뜨는 성향 검사 문항.
 * 공용 QuestionCard 는 도메인을 모르므로, 여기서 TEST_QUESTIONS 를 매핑해 넘긴다.
 */
export default function TestQuestionCard({
  currentIndex,
  selectedValue,
  onSelect,
  onPrev,
  onNext,
  onSkip,
  onClose,
}: TestQuestionCardProps) {
  const question = TEST_QUESTIONS[currentIndex];

  return (
    <QuestionCard
      title="성향검사를 진행중이예요~"
      imageSrc="/images/chat/test-character.png"
      question={question.question}
      options={question.options.map(({ score, label }) => ({
        value: score,
        label,
      }))}
      currentIndex={currentIndex}
      total={TEST_QUESTIONS.length}
      selectedValue={selectedValue}
      onSelect={onSelect}
      onPrev={onPrev}
      onNext={onNext}
      onSkip={onSkip}
      onClose={onClose}
    />
  );
}
