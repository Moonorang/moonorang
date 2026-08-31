interface EmptyNoticeProps {
  message: string;
}

// COMMON-003: 표시할 데이터가 없는 영역 안내
export default function EmptyNotice({ message }: EmptyNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-background-default px-4 py-10 text-center">
      <p className="text-14 font-medium text-text-primary">{message}</p>
      <p className="text-12 text-text-secondary">잠시 후 다시 확인해 주세요.</p>
    </div>
  );
}
