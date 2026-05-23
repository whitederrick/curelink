'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, Languages, Pill, Soup, Sparkles } from 'lucide-react';

const I18N = {
  ko: {
    title: '\uc624\ub298\uc758 \ub3cc\ubd04 \uc77c\uc9c0',
    subtitle: '\ud544\uc218 \uae30\ub85d\uc740 \ubc84\ud2bc\uc73c\ub85c \ube60\ub974\uac8c \ub0a8\uae30\uace0, \ud544\uc694\ud55c \ub9d0\uc740 \ud3b8\ud55c \uc5b8\uc5b4\ub85c \uc801\uc5b4\uc8fc\uc138\uc694.',
    meal: '\uc2dd\uc0ac \uc0c1\ud0dc',
    medication: '\ubcf5\uc57d \ud655\uc778',
    medicationHelp: '\uc815\ud574\uc9c4 \uc57d\uc744 \uc2dc\uac04\uc5d0 \ub9de\ucdb0 \ubcf5\uc6a9\ud588\uc5b4\uc694.',
    note: '\uc790\uc720 \uba54\ubaa8',
    notePlaceholder: 'Example: Patient walked slowly but looked comfortable after lunch.',
    translation: '\ubc88\uc5ed \ub300\uae30 \ud544\ub4dc',
    translationHelp: '\uc800\uc7a5 \ud6c4 OpenAI \ubc88\uc5ed API\ub85c \ubcf4\ud638\uc790\uc6a9 \ud55c\uad6d\uc5b4 \uc77c\uc9c0\uac00 \uc0dd\uc131\ub429\ub2c8\ub2e4.',
    save: '\uc77c\uc9c0 \uc800\uc7a5',
  },
};

const MEAL_OPTIONS = [
  { value: 'GOOD', label: 'Good', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'FAIR', label: 'Fair', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'POOR', label: 'Poor', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function CareLogForm() {
  const t = I18N.ko;
  const [mealStatus, setMealStatus] = useState('GOOD');
  const [medicationChecked, setMedicationChecked] = useState(true);
  const [rawLogText, setRawLogText] = useState('');

  return (
    <section className="bg-slate-50 px-5 py-7 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <p className="mb-1 flex items-center gap-2 text-sm font-bold text-sky-600">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Care Log
          </p>
          <h2 className="text-xl font-black tracking-tight text-slate-950">{t.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">{t.subtitle}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
              <Soup className="h-4 w-4 text-sky-500" aria-hidden="true" />
              {t.meal}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MEAL_OPTIONS.map((option) => {
                const isSelected = mealStatus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMealStatus(option.value)}
                    className={`min-h-20 rounded-2xl border px-2 text-center transition active:scale-95 ${
                      isSelected ? option.tone : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <CheckCircle2
                      className={`mx-auto mb-2 h-5 w-5 ${isSelected ? '' : 'opacity-30'}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-black">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMedicationChecked((value) => !value)}
            className={`flex min-h-16 w-full items-center gap-3 rounded-3xl border p-4 text-left transition active:scale-95 ${
              medicationChecked
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
            aria-pressed={medicationChecked}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white">
              <Pill className="h-5 w-5 text-sky-500" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">{t.medication}</span>
              <span className="mt-0.5 block text-xs font-bold opacity-80">{t.medicationHelp}</span>
            </span>
            {medicationChecked && <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />}
          </button>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <label htmlFor="rawLogText" className="mb-3 block text-sm font-black text-slate-800">
              {t.note}
            </label>
            <textarea
              id="rawLogText"
              value={rawLogText}
              onChange={(event) => setRawLogText(event.target.value)}
              placeholder={t.notePlaceholder}
              className="min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

            <div className="mt-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-3">
              <p className="flex items-center gap-2 text-sm font-black text-sky-700">
                <Languages className="h-4 w-4" aria-hidden="true" />
                {t.translation}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{t.translationHelp}</p>
            </div>
          </div>

          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-base font-black text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 active:scale-95"
          >
            <Sparkles className="h-5 w-5 text-sky-300" aria-hidden="true" />
            {t.save}
          </button>
        </div>
      </div>
    </section>
  );
}
