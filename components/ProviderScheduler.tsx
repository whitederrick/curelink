'use client';

import { useMemo, useState } from 'react';
import { Check, Clock3, RotateCcw } from 'lucide-react';

const TEXT = {
  sectionLabel: 'Weekly Availability',
  title: '\uadfc\ubb34 \uac00\ub2a5 \uc2dc\uac04 \uc124\uc815',
  description: '\uac00\ub2a5\ud55c \uc694\uc77c\uacfc \uc2dc\uac04\ub300\ub97c \ud06c\uac8c \ud130\uce58\ud574\uc11c \ucf1c\uace0 \ub044\ub294 \ubc29\uc2dd\uc785\ub2c8\ub2e4.',
  reset: '\uc120\ud0dd \ucd08\uae30\ud654',
  selectedTime: '\uc120\ud0dd\ub41c \uc2dc\uac04',
  countSuffix: '\uac1c',
};

const DAYS = [
  { id: 1, label: '\uc6d4' },
  { id: 2, label: '\ud654' },
  { id: 3, label: '\uc218' },
  { id: 4, label: '\ubaa9' },
  { id: 5, label: '\uae08' },
  { id: 6, label: '\ud1a0' },
  { id: 0, label: '\uc77c' },
];

const TIME_BLOCKS = [
  { id: 'morning', label: '\uc624\uc804', helper: '09-13', start: '09:00', end: '13:00' },
  { id: 'afternoon', label: '\uc624\ud6c4', helper: '13-18', start: '13:00', end: '18:00' },
  { id: 'night', label: '\uc57c\uac04', helper: '18-22', start: '18:00', end: '22:00' },
];

type SlotKey = `${number}-${string}`;

export type ProviderAvailability = {
  dayOfWeek: number;
  timeBlock: string;
  startTime: string;
  endTime: string;
};

export default function ProviderScheduler() {
  const [selectedSlots, setSelectedSlots] = useState<Set<SlotKey>>(
    () => new Set<SlotKey>(['1-morning', '3-afternoon', '5-night']),
  );

  const availability = useMemo<ProviderAvailability[]>(() => {
    return Array.from(selectedSlots).map((slotKey) => {
      const [dayOfWeek, timeBlock] = slotKey.split('-');
      const block = TIME_BLOCKS.find((item) => item.id === timeBlock)!;

      return {
        dayOfWeek: Number(dayOfWeek),
        timeBlock,
        startTime: block.start,
        endTime: block.end,
      };
    });
  }, [selectedSlots]);

  const toggleSlot = (dayId: number, blockId: string) => {
    const key = `${dayId}-${blockId}` as SlotKey;

    setSelectedSlots((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  return (
    <section className="bg-white px-5 py-7 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-bold text-sky-600">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {TEXT.sectionLabel}
            </p>
            <h2 className="text-xl font-black tracking-tight text-slate-950">{TEXT.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
              {TEXT.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSlots(new Set<SlotKey>())}
            className="flex min-h-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-600 transition active:scale-95"
            aria-label={TEXT.reset}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-7 gap-1.5">
          {DAYS.map((day) => (
            <div
              key={day.id}
              className="flex h-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white"
            >
              {day.label}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {TIME_BLOCKS.map((block) => (
            <div key={block.id} className="grid grid-cols-7 gap-1.5">
              {DAYS.map((day) => {
                const isSelected = selectedSlots.has(`${day.id}-${block.id}` as SlotKey);

                return (
                  <button
                    key={`${day.id}-${block.id}`}
                    type="button"
                    onClick={() => toggleSlot(day.id, block.id)}
                    className={`min-h-20 rounded-2xl border px-1.5 text-center transition active:scale-95 ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="mx-auto mb-1 flex h-5 w-5 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className="block text-xs font-black">{block.label}</span>
                    <span className="block text-[11px] font-bold">{block.helper}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">{TEXT.selectedTime}</p>
            <p className="text-sm font-black text-sky-600">
              {availability.length}
              {TEXT.countSuffix}
            </p>
          </div>
          <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-900 p-3 text-xs font-semibold leading-5 text-slate-100">
            {JSON.stringify(availability, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
