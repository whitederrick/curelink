export type UtcScheduleWindow = {
  local_timezone: string;
  start_at_utc: string;
  end_at_utc: string;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getTimeZoneDateParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    return Number(value ?? 0);
  };

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second'),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneDateParts(date, timeZone);
  const utcFromZoneParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return utcFromZoneParts - date.getTime();
}

function zonedDateTimeToUtc(parts: DateParts, timeZone: string) {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  let utcTime = localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  utcTime = localAsUtc - getTimeZoneOffsetMs(new Date(utcTime), timeZone);

  return new Date(utcTime);
}

function getNextDatePartsForDay(dayOfWeek: number, timeZone: string, referenceDate = new Date()) {
  const nowInTargetZone = getTimeZoneDateParts(referenceDate, timeZone);
  const targetZoneDate = new Date(
    Date.UTC(nowInTargetZone.year, nowInTargetZone.month - 1, nowInTargetZone.day),
  );
  const currentDay = targetZoneDate.getUTCDay();
  const distance = (dayOfWeek + 7 - currentDay) % 7;

  targetZoneDate.setUTCDate(targetZoneDate.getUTCDate() + distance);

  return {
    year: targetZoneDate.getUTCFullYear(),
    month: targetZoneDate.getUTCMonth() + 1,
    day: targetZoneDate.getUTCDate(),
  };
}

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
}

export function convertLocalScheduleToUTC(
  dayOfWeek: number,
  timeStr: string,
  timeZone = 'Asia/Seoul',
  referenceDate = new Date(),
): string {
  const dateParts = getNextDatePartsForDay(dayOfWeek, timeZone, referenceDate);
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number);
  const utcDate = zonedDateTimeToUtc(
    {
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      hour: hours,
      minute: minutes,
      second: seconds,
    },
    timeZone,
  );

  return utcDate.toISOString();
}

export function buildUtcScheduleWindow(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  explicitTimeZone?: string,
): UtcScheduleWindow {
  const targetTimeZone = explicitTimeZone || getDeviceTimeZone();
  const referenceDate = new Date();
  const startAtUtc = convertLocalScheduleToUTC(dayOfWeek, startTime, targetTimeZone, referenceDate);
  let endAtUtc = convertLocalScheduleToUTC(dayOfWeek, endTime, targetTimeZone, referenceDate);

  if (new Date(endAtUtc).getTime() <= new Date(startAtUtc).getTime()) {
    endAtUtc = new Date(new Date(endAtUtc).getTime() + 24 * 60 * 60 * 1000).toISOString();
  }

  return {
    local_timezone: targetTimeZone,
    start_at_utc: startAtUtc,
    end_at_utc: endAtUtc,
  };
}
