const KOREA_TIME_ZONE = "Asia/Seoul";

const koreanDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KOREA_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const koreanDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KOREA_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatKoreanDate(value: string) {
  return koreanDateFormatter.format(new Date(value));
}

export function formatKoreanDateTime(value: string) {
  return koreanDateTimeFormatter.format(new Date(value));
}
