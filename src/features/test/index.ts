// features/test Public API — 취미 성향 검사 (TEST-001~012)
export { default as TestLoadingModal } from './components/TestLoadingModal';
export { default as TestResult } from './components/TestResult';
export { default as TestQuestionCard } from './components/TestQuestionCard';
export { useTestResult } from './hooks/useTestResult';
export { useTestFlow } from './hooks/useTestFlow';
export { useTestStore } from './store/testStore';
export { diagnoseLeisureType } from './lib/diagnose';
export { TEST_QUESTIONS } from './data/questions';
export { LEISURE_TYPES } from './data/leisureTypes';
export type {
  LeisureTypeId,
  LeisureType,
  TestQuestion,
  TestOption,
  Diagnosis,
  TestBenefit,
  BenefitIcon,
} from './types';
