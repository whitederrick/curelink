'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, Clock, RefreshCw, Save, Sparkles, Wand2 } from 'lucide-react';

type WeekDayId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type TimeSlotId = 'SLOT_MORNING' | 'SLOT_AFTERNOON' | 'SLOT_NIGHT';
type ScheduleState = Partial<Record<WeekDayId, Partial<Record<TimeSlotId, boolean>>>>;

type AvailabilityPayload = {
  day_of_week: WeekDayId;
  start_time: string;
  end_time: string;
};

const TEXT = {
  title: '\uac00\uc6a9 \uc2dc\uac04 \ub9e4\uce6d \ub9e4\ub2c8\uc800',
  subtitle:
    '\ud06c\ub8e8\ub2d8\uc774 \ud65c\ub3d9 \uac00\ub2a5\ud55c \uc694\uc77c\uacfc \uc2dc\uac04\ub300\ub97c \ucf1c\ub450\uba74 \ub9e4\uce6d \ud655\ub960\uc774 \ub192\uc544\uc838\uc694.',
  quickActions: 'Quick Actions',
  applyWeekdays: '\ud3c9\uc77c \uc77c\uad04 \uc801\uc6a9',
  applyWeekend: '\uc8fc\ub9d0 \uc77c\uad04 \uc801\uc6a9',
  selectWholeWeek: '\uc774\ubc88 \uc8fc \uc804\uccb4 \uc120\ud0dd',
  reset: '\ucd08\uae30\ud654',
  slotSelectSuffix: '\uc694\uc77c \uc2dc\uac04\ub300 \ube14\ub85d \uc120\ud0dd',
  selected: '\uc120\ud0dd\ub428',
  notSelected: '\ubbf8\uc120\ud0dd',
  summary: '\uc800\uc7a5 \uc608\uc815 \uc2dc\uac04',
  countSuffix: '\uac1c',
  save: '\uc124\uc815 \uc644\ub8cc \ubc0f \uc800\uc7a5\ud558\uae30',
  saved: '\uc8fc\uac04 \uac00\uc6a9 \uc2dc\uac04\uc774 \uc800\uc7a5 \ud615\uc2dd\uc73c\ub85c \uc900\ube44\ub410\uc2b5\ub2c8\ub2e4.',
};

const WEEK_DAYS: Array<{ id: WeekDayId; label: string; enLabel: string }> = [
  { id: 1, label: '\uc6d4', enLabel: 'Mon' },
  { id: 2, label: '\ud654', enLabel: 'Tue' },
  { id: 3, label: '\uc218', enLabel: 'Wed' },
  { id: 4, label: '\ubaa9', enLabel: 'Thu' },
  { id: 5, label: '\uae08', enLabel: 'Fri' },
  { id: 6, label: '\ud1a0', enLabel: 'Sat' },
  { id: 0, label: '\uc77c', enLabel: 'Sun' },
];

const TIME_SLOTS: Array<{
  id: TimeSlotId;
  label: string;
  timeRange: string;
  start: string;
  end: string;
}> = [
  {
    id: 'SLOT_MORNING',
    label: '\uc624\uc804 \ucf00\uc5b4',
    timeRange: '09:00 - 13:00',
    start: '09:00:00',
    end: '13:00:00',
  },
  {
    id: 'SLOT_AFTERNOON',
    label: '\uc624\ud6c4 \ucf00\uc5b4',
    timeRange: '13:00 - 18:00',
    start: '13:00:00',
    end: '18:00:00',
  },
  {
    id: 'SLOT_NIGHT',
    label: '\uc57c\uac04 \ucf00\uc5b4',
    timeRange: '18:00 - 22:00',
    start: '18:00:00',
    end: '22:00:00',
  },
];

const INITIAL_SCHEDULE: ScheduleState = {
  1: { SLOT_MORNING: true, SLOT_AFTERNOON: true },
  2: { SLOT_MORNING: true },
};

function buildPayload(scheduleState: ScheduleState): AvailabilityPayload[] {
  return Object.entries(scheduleState).flatMap(([dayKey, slots]) => {
    const dayOfWeek = Number(dayKey) as WeekDayId;

    return Object.entries(slots ?? {})
      .filter(([, isAvailable]) => isAvailable)
      .map(([slotId]) => {
        const slot = TIME_SLOTS.find((item) => item.id === slotId);

        return {
          day_of_week: dayOfWeek,
          start_time: slot?.start ?? '',
          end_time: slot?.end ?? '',
        };
      })
      .filter((payload) => payload.start_time && payload.end_time);
  });
}

function hasAvailableSlot(daySchedule: ScheduleState[WeekDayId]) {
  return Object.values(daySchedule ?? {}).some(Boolean);
}

export default function WeeklyScheduler() {
  const [selectedDay, setSelectedDay] = useState<WeekDayId>(1);
  const [scheduleState, setScheduleState] = useState<ScheduleState>(INITIAL_SCHEDULE);
  const [savedMessageVisible, setSavedMessageVisible] = useState(false);

  const selectedDayLabel = WEEK_DAYS.find((day) => day.id === selectedDay)?.label ?? '';
  const payload = useMemo(() => buildPayload(scheduleState), [scheduleState]);

  const toggleSlot = (day: WeekDayId, slotId: TimeSlotId) => {
    setSavedMessageVisible(false);
    setScheduleState((prev) => {
      const daySchedule = prev[day] ?? {};

      return {
        ...prev,
        [day]: {
          ...daySchedule,
          [slotId]: !daySchedule[slotId],
        },
      };
    });
  };

  const applyCurrentDayToDays = (targetDays: WeekDayId[]) => {
    setSavedMessageVisible(false);
    setScheduleState((prev) => {
      const currentDaySlots = { ...(prev[selectedDay] ?? {}) };
      const next = { ...prev };

      targetDays.forEach((day) => {
        next[day] = { ...currentDaySlots };
      });

      return next;
    });
  };

  const selectWholeWeek = () => {
    setSavedMessageVisible(false);
    setScheduleState(() => {
      const allSlots = TIME_SLOTS.reduce<Partial<Record<TimeSlotId, boolean>>>((acc, slot) => {
        acc[slot.id] = true;
        return acc;
      }, {});

      return WEEK_DAYS.reduce<ScheduleState>((acc, day) => {
        acc[day.id] = { ...allSlots };
        return acc;
      }, {});
    });
  };

  const resetSchedule = () => {
    setSavedMessageVisible(false);
    setScheduleState({});
  };

  const handleSave = () => {
    console.log('CureLink provider_schedules payload:', payload);
    setSavedMessageVisible(true);
  };

  return (
    <section className="bg-slate-50 px-5 py-7 text-slate-900">
      <div className="mx-auto max-w-md overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-soft">
        <header className="bg-slate-950 px-5 pb-7 pt-6 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/25">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
            {TEXT.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-400">{TEXT.subtitle}</p>
        </header>

        <div className="-mt-4 px-4">
          <div className="flex gap-1.5 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            {WEEK_DAYS.map((day) => {
              const isSelected = selectedDay === day.id;
              const hasData = hasAvailableSlot(scheduleState[day.id]);

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`relative flex min-h-14 min-w-12 flex-1 flex-col items-center justify-center rounded-2xl transition active:scale-95 ${
                    isSelected
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-950/20'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-sm font-black">{day.label}</span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-sky-300' : 'text-slate-400'}`}>
                    {day.enLabel}
                  </span>
                  {hasData && !isSelected && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
              {TEXT.quickActions}
            </p>
            <p className="text-xs font-black text-sky-600">
              {payload.length}
              {TEXT.countSuffix}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyCurrentDayToDays([1, 2, 3, 4, 5])}
              className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              {TEXT.applyWeekdays}
            </button>
            <button
              type="button"
              onClick={() => applyCurrentDayToDays([6, 0])}
              className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              {TEXT.applyWeekend}
            </button>
            <button
              type="button"
              onClick={selectWholeWeek}
              className="min-h-11 rounded-2xl bg-sky-50 px-3 text-xs font-black text-sky-700 transition hover:bg-sky-100 active:scale-95"
            >
              <span className="inline-flex items-center gap-1">
                <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                {TEXT.selectWholeWeek}
              </span>
            </button>
            <button
              type="button"
              onClick={resetSchedule}
              className="min-h-11 rounded-2xl bg-slate-900 px-3 text-xs font-black text-white transition hover:bg-slate-800 active:scale-95"
            >
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                {TEXT.reset}
              </span>
            </button>
          </div>

          <div className="mt-6">
            <p className="mb-3 px-1 text-xs font-black uppercase tracking-wide text-slate-400">
              {selectedDayLabel}
              {TEXT.slotSelectSuffix}
            </p>

            <div className="space-y-3">
              {TIME_SLOTS.map((slot) => {
                const isSelected = !!scheduleState[selectedDay]?.[slot.id];

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleSlot(selectedDay, slot.id)}
                    className={`flex min-h-24 w-full items-center justify-between rounded-3xl border p-5 text-left transition duration-150 active:scale-[0.99] ${
                      isSelected
                        ? 'border-sky-600 bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex min-w-0 items-center gap-3.5">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          isSelected ? 'bg-sky-600/40' : 'bg-white text-slate-500'
                        }`}
                      >
                        <Clock className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-black tracking-tight">{slot.label}</span>
                        <span
                          className={`mt-0.5 block text-xs font-bold ${
                            isSelected ? 'text-sky-100' : 'text-slate-400'
                          }`}
                        >
                          {slot.timeRange}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? 'scale-110 border-white bg-white text-sky-500'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                    </span>
                    <span className="sr-only">{isSelected ? TEXT.selected : TEXT.notSelected}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-black text-slate-800">{TEXT.summary}</p>
              <p className="text-sm font-black text-sky-600">
                {payload.length}
                {TEXT.countSuffix}
              </p>
            </div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-3 text-xs font-semibold leading-5 text-slate-100">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          {savedMessageVisible && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {TEXT.saved}
            </div>
          )}
        </div>

        <footer className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white/80 p-5 pt-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-base font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-900 active:scale-[0.97]"
          >
            <Save className="h-5 w-5 text-sky-400" aria-hidden="true" />
            {TEXT.save}
          </button>
        </footer>
      </div>
    </section>
  );
}
