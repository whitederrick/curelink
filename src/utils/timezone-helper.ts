export type UtcScheduleWindow = {
  local_timezone: string;
  start_at_utc: string;
  end_at_utc: string;
};

function getNextDateForDay(dayOfWeek: number) {
  const now = new Date();
  const currentDay = now.getDay();
  const distance = (dayOfWeek + 7 - currentDay) % 7;
  const targetDate = new Date(now);

  targetDate.setDate(now.getDate() + distance);

  return targetDate;
}

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
}

export function convertLocalScheduleToUTC(dayOfWeek: number, timeStr: string): string {
  const targetDate = getNextDateForDay(dayOfWeek);
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number);

  targetDate.setHours(hours, minutes, seconds, 0);

  return targetDate.toISOString();
}

export function buildUtcScheduleWindow(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): UtcScheduleWindow {
  return {
    local_timezone: getDeviceTimeZone(),
    start_at_utc: convertLocalScheduleToUTC(dayOfWeek, startTime),
    end_at_utc: convertLocalScheduleToUTC(dayOfWeek, endTime),
  };
}
