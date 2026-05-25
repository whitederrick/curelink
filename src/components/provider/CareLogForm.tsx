'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  FileText,
  Frown,
  Languages,
  Meh,
  Pill,
  Send,
  Smile,
  Soup,
  Utensils,
} from 'lucide-react';
import { callCureLinkFunction } from '@/lib/edgeFunctions';

type MealStatus = 'GOOD' | 'FAIR' | 'POOR';
type ConditionStatus = 'GOOD' | 'NORMAL' | 'BAD';
type RawLogLang = 'ko' | 'en' | 'vi' | 'zh';

type MatchLogPayload = {
  match_id: string;
  meal_status: MealStatus;
  condition_status: ConditionStatus;
  medication_checked: boolean;
  raw_log_lang: RawLogLang;
  raw_log_text: string;
};

type SubmittedCareLog = {
  id: string;
  external_match_key?: string;
  status?: string;
};

type CareLogFormProps = {
  matchId?: string;
  patientName?: string;
  careTypeLabel?: string;
};

const TEXT = {
  sectionLabel: 'Care Log',
  titleSuffix: '\uc77c\uc9c0 \uc791\uc131',
  description:
    '\uc624\ub298 \uc9c4\ud589\ud55c \ucf00\uc5b4\ub97c 10\ucd08 \uc548\uc5d0 \uae30\ub85d\ud574 \uc8fc\uc138\uc694. \uccb4\ud06c \ud56d\ubaa9\uc740 \ubcf4\ud638\uc790\uc6a9 \ub9ac\ud3ec\ud2b8\ub85c \uc790\ub3d9 \uc815\ub9ac\ub429\ub2c8\ub2e4.',
  meal: '\uc2dd\uc0ac \uc0c1\ud0dc',
  condition: '\ud658\uc790 \uae30\ubd84 / \ucee8\ub514\uc158',
  medication: '\ud544\uc218 \ubcf5\uc57d \uccb4\ud06c',
  note: '\uc885\ud569 \ud2b9\uc774\uc0ac\ud56d',
  languageLabel: '\uc791\uc131 \uc5b8\uc5b4',
  notePlaceholder:
    '\ud658\uc790\uc758 \uac78\uc74c\uac78\uc774, \ud1b5\uc99d \ud638\uc18c, \ubcf4\ud638\uc790\uc5d0\uac8c \uc804\ub2ec\ud560 \ub0b4\uc6a9\uc744 \ud3b8\ud55c \uc5b8\uc5b4\ub85c \uc791\uc131\ud574 \uc8fc\uc138\uc694.',
  translationGuide:
    '\uc120\ud0dd\ud55c \uc5b8\uc5b4\ub85c \uc785\ub825\ud558\uba74 AI\uac00 \ubb38\ub9e5\uc744 \ubd84\uc11d\ud574 \ubcf4\ud638\uc790\uc6a9 \ud55c\uad6d\uc5b4 \ubcf4\uace0\uc11c\ub85c \ubc88\uc5ed/\uc694\uc57d\ud569\ub2c8\ub2e4.',
  submit: '\uc77c\uc9c0 \uc81c\ucd9c\ud558\uae30',
  missingRequired:
    '\uc2dd\uc0ac, \ucee8\ub514\uc158, \ubcf5\uc57d \uc5ec\ubd80\ub97c \ubaa8\ub450 \uccb4\ud06c\ud574 \uc8fc\uc138\uc694.',
  submitted:
    '돌봄 일지가 Supabase match_logs에 저장되었습니다.',
  payloadPreview: 'match_logs payload',
  medicationDone: '\ubcf5\uc57d \uc644\ub8cc',
  medicationSkipped: '\ubbf8\ubcf5\uc57d / \ud574\ub2f9\uc5c6\uc74c',
  submitting: '저장 중...',
  submitError: '일지 저장에 실패했습니다.',
};

const LANGUAGES_OPTION: Array<{ code: RawLogLang; label: string }> = [
  { code: 'ko', label: '\ud55c\uad6d\uc5b4 (Korean)' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Ti\u1ebfng Vi\u1ec7t (Vietnamese)' },
  { code: 'zh', label: '\u4e2d\u6587 (Chinese)' },
];

const MEAL_OPTIONS: Array<{
  id: MealStatus;
  label: string;
  helper: string;
  Icon: typeof Utensils;
}> = [
  {
    id: 'GOOD',
    label: '\uc798 \ub4dc\uc2ec',
    helper: 'Good',
    Icon: Utensils,
  },
  {
    id: 'FAIR',
    label: '\ubcf4\ud1b5',
    helper: 'Fair',
    Icon: Soup,
  },
  {
    id: 'POOR',
    label: '\uc801\uac8c \ub4dc\uc2ec',
    helper: 'Poor',
    Icon: AlertCircle,
  },
];

const CONDITION_OPTIONS: Array<{
  id: ConditionStatus;
  label: string;
  helper: string;
  Icon: typeof Smile;
}> = [
  {
    id: 'GOOD',
    label: '\uc88b\uc74c',
    helper: 'Good',
    Icon: Smile,
  },
  {
    id: 'NORMAL',
    label: '\ubcf4\ud1b5',
    helper: 'Normal',
    Icon: Meh,
  },
  {
    id: 'BAD',
    label: '\ub098\uc068',
    helper: 'Bad',
    Icon: Frown,
  },
];

const DEFAULT_TARGET_PATIENT = {
  matchId: 'match-001',
  name: '\uae40OO \uc5b4\ub974\uc2e0',
  type: '\ud1f4\uc6d0 \ube0c\ub9bf\uc9c0 \ucf00\uc5b4',
};

function buildPayload(
  matchId: string,
  mealStatus: MealStatus | '',
  conditionStatus: ConditionStatus | '',
  medicationChecked: boolean | null,
  rawLogLang: RawLogLang,
  rawLogText: string,
): MatchLogPayload | null {
  if (!mealStatus || !conditionStatus || medicationChecked === null) {
    return null;
  }

  return {
    match_id: matchId,
    meal_status: mealStatus,
    condition_status: conditionStatus,
    medication_checked: medicationChecked,
    raw_log_lang: rawLogLang,
    raw_log_text: rawLogText.trim(),
  };
}

export default function CareLogForm({ matchId, patientName, careTypeLabel }: CareLogFormProps) {
  const [mealStatus, setMealStatus] = useState<MealStatus | ''>('');
  const [conditionStatus, setConditionStatus] = useState<ConditionStatus | ''>('');
  const [medicationChecked, setMedicationChecked] = useState<boolean | null>(null);
  const [rawLogLang, setRawLogLang] = useState<RawLogLang>('ko');
  const [rawLogText, setRawLogText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedPayload, setSubmittedPayload] = useState<MatchLogPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetPatient = useMemo(
    () => ({
      matchId: matchId || DEFAULT_TARGET_PATIENT.matchId,
      name: patientName || DEFAULT_TARGET_PATIENT.name,
      type: careTypeLabel || DEFAULT_TARGET_PATIENT.type,
    }),
    [careTypeLabel, matchId, patientName],
  );

  const livePayload = useMemo(
    () =>
      buildPayload(
        targetPatient.matchId,
        mealStatus,
        conditionStatus,
        medicationChecked,
        rawLogLang,
        rawLogText,
      ),
    [conditionStatus, mealStatus, medicationChecked, rawLogLang, rawLogText, targetPatient.matchId],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload(
      targetPatient.matchId,
      mealStatus,
      conditionStatus,
      medicationChecked,
      rawLogLang,
      rawLogText,
    );

    if (!payload) {
      setSubmittedPayload(null);
      setErrorMessage(TEXT.missingRequired);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const careLog = await callCureLinkFunction<SubmittedCareLog>('submit-care-log', payload);

      const aiResponse = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          match_id: careLog.id,
        }),
      });

      const aiResult = await aiResponse.json();
      if (!aiResponse.ok || !aiResult.success) {
        throw new Error(aiResult.error ?? 'AI insight generation failed.');
      }

      setSubmittedPayload(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : TEXT.submitError;
      setSubmittedPayload(null);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-50 px-5 py-7 pb-24 text-slate-900">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-soft"
      >
        <header className="bg-slate-950 px-5 pb-7 pt-6 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/25">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-sky-300">
            {targetPatient.type}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight">
            {targetPatient.name} {TEXT.titleSuffix}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-400">
            {TEXT.description}
          </p>
        </header>

        <div className="space-y-6 px-5 py-5">
          <fieldset>
            <legend className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
              <Utensils className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {TEXT.meal}
            </legend>
            <div className="grid grid-cols-3 gap-2.5">
              {MEAL_OPTIONS.map(({ id, label, helper, Icon }) => {
                const isSelected = mealStatus === id;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      setMealStatus(id);
                      setErrorMessage('');
                    }}
                    className={`min-h-24 rounded-2xl border p-3 text-center transition active:scale-95 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Icon
                      className={`mx-auto mb-2 h-6 w-6 ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="block text-sm font-black">{label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] font-bold ${
                        isSelected ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      {helper}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
              <Smile className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {TEXT.condition}
            </legend>
            <div className="grid grid-cols-3 gap-2.5">
              {CONDITION_OPTIONS.map(({ id, label, helper, Icon }) => {
                const isSelected = conditionStatus === id;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      setConditionStatus(id);
                      setErrorMessage('');
                    }}
                    className={`min-h-24 rounded-2xl border p-3 text-center transition active:scale-95 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Icon
                      className={`mx-auto mb-2 h-7 w-7 ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="block text-sm font-black">{label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] font-bold ${
                        isSelected ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      {helper}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-800">
              <Pill className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {TEXT.medication}
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMedicationChecked(true);
                  setErrorMessage('');
                }}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-black transition active:scale-95 ${
                  medicationChecked === true
                    ? 'border-sky-600 bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
                aria-pressed={medicationChecked === true}
              >
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                {TEXT.medicationDone}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMedicationChecked(false);
                  setErrorMessage('');
                }}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-black transition active:scale-95 ${
                  medicationChecked === false
                    ? 'border-rose-600 bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
                aria-pressed={medicationChecked === false}
              >
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
                {TEXT.medicationSkipped}
              </button>
            </div>
          </fieldset>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label
                htmlFor="rawLogText"
                className="flex items-center gap-1.5 text-sm font-black text-slate-800"
              >
                <Languages className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {TEXT.note}
              </label>
              <label className="relative shrink-0">
                <span className="sr-only">{TEXT.languageLabel}</span>
                <select
                  value={rawLogLang}
                  onChange={(event) => setRawLogLang(event.target.value as RawLogLang)}
                  className="min-h-10 appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-black text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  {LANGUAGES_OPTION.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </label>
            </div>

            <textarea
              id="rawLogText"
              value={rawLogText}
              onChange={(event) => setRawLogText(event.target.value)}
              placeholder={TEXT.notePlaceholder}
              rows={4}
              className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-base font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

            <div className="mt-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-3">
              <p className="flex items-center gap-2 text-sm font-black text-sky-700">
                <Languages className="h-4 w-4" aria-hidden="true" />
                AI Translation Ready
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                {TEXT.translationGuide}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {errorMessage}
            </div>
          )}

          {submittedPayload && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {TEXT.submitted}
            </div>
          )}

          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-black text-slate-800">{TEXT.payloadPreview}</p>
              <p className="text-xs font-black text-sky-600">
                {livePayload ? 'READY' : 'WAITING'}
              </p>
            </div>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-3 text-xs font-semibold leading-5 text-slate-100">
              {JSON.stringify(
                livePayload ?? {
                  match_id: targetPatient.matchId,
                  meal_status: mealStatus || null,
                  condition_status: conditionStatus || null,
                  medication_checked: medicationChecked,
                  raw_log_lang: rawLogLang,
                  raw_log_text: rawLogText.trim(),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>

        <footer className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white/80 p-5 pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-base font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-900 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send className="h-5 w-5 text-sky-400" aria-hidden="true" />
            {isSubmitting ? TEXT.submitting : TEXT.submit}
          </button>
        </footer>
      </form>
    </section>
  );
}
