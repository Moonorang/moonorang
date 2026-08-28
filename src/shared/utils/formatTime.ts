export type DateInput = Date | string | number;

export interface FormattedMessageTime {
  label: string;
  dateTime: string;
}

const messageTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Seoul',
});

export function formatMessageTime(
  value: DateInput,
): FormattedMessageTime | null {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return {
    label: messageTimeFormatter.format(date),
    dateTime: date.toISOString(),
  };
}
