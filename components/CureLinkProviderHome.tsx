'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Globe2,
  HeartPulse,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';

type ProviderTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'MASTER';
type ScheduleStatus = 'WAITING' | 'ONGOING' | 'COMPLETED';
type Religion = 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'NONE';
type EscortType = 'DISCHARGE_BRIDGE_CARE' | 'MEDICAL_TOURISM_CONCIERGE' | 'SENIOR_DAILY_CARE';

const TEXT = {
  providerHome: 'Provider Home',
  openLanguage: '\uc5b8\uc5b4 \uc124\uc815 \uc5f4\uae30',
  crewSuffix: '\ud06c\ub8e8\ub2d8',
  welcome: '\uc624\ub298\ub3c4 \ud658\uc790\uc758 \uc548\uc804\ud55c \uc77c\uc0c1 \ud68c\ubcf5\uc744 \uc5f0\uacb0\ud574 \uc8fc\uc138\uc694.',
  withdrawableAmount: '\ucd9c\uae08 \uac00\ub2a5 \uae08\uc561',
  won: '\uc6d0',
  safetyScore: '\uc548\uc804 \uc810\uc218',
  requestSettlement: '\uc815\uc0b0 \uc2e0\uccad',
  todaySchedule: 'Today Schedule',
  todayCare: '\uc624\ub298\uc758 \uc5d0\uc2a4\ucf54\ud2b8/\ub3cc\ubd04',
  activeCount: '\uc9c4\ud589',
  cases: '\uac74',
  language: '\uc5b8\uc5b4',
  preferredReligion: '\uc120\ud638 \uc885\uad50',
  detailAndLog: '\uc0c1\uc138 \ubc0f \uc77c\uc9c0 \uc791\uc131',
};

const MAPPING_DICTIONARY = {
  tier: {
    BRONZE: '\ube0c\ub860\uc988 \ud06c\ub8e8',
    SILVER: '\uc2e4\ubc84 \ud06c\ub8e8',
    GOLD: '\uace8\ub4dc \ud06c\ub8e8',
    MASTER: '\ub9c8\uc2a4\ud130 \ud06c\ub8e8',
  } satisfies Record<ProviderTier, string>,

  status: {
    WAITING: '\ub300\uae30\uc911',
    ONGOING: '\uc9c4\ud589\uc911',
    COMPLETED: '\uc644\ub8cc',
  } satisfies Record<ScheduleStatus, string>,

  religion: {
    CHRISTIAN: '\uae30\ub3c5\uad50',
    BUDDHIST: '\ubd88\uad50',
    CATHOLIC: '\uac00\ud1a8\ub9ad',
    NONE: '\ubb34\uad50',
  } satisfies Record<Religion, string>,

  type: {
    DISCHARGE_BRIDGE_CARE: '\ud1f4\uc6d0 \ube0c\ub9bf\uc9c0 \ucf00\uc5b4',
    MEDICAL_TOURISM_CONCIERGE: '\uc758\ub8cc \uad00\uad11 \ucee8\uc2dc\uc5b4\uc9c0',
    SENIOR_DAILY_CARE: '\uc2dc\ub2c8\uc5b4 \uc77c\uc0c1 \ub3cc\ubd04',
  } satisfies Record<EscortType, string>,
};

const provider = {
  name: 'Alex Kim',
  tier: 'GOLD' as ProviderTier,
  tierCode: 'GOLD CREW',
  availableAmount: 125000,
  languageLabel: 'EN / KO',
  safetyScore: 98,
};

const todaySchedules = [
  {
    id: 1,
    time: '09:00 - 13:00',
    type: 'DISCHARGE_BRIDGE_CARE' as EscortType,
    patient: '\uae40OO \uc5b4\ub974\uc2e0',
    condition: '\uace0\uad00\uc808 \uc218\uc220 \ud1f4\uc6d0',
    location: '\uac15\ub0a8\uc138\ube0c\ub780\uc2a4 \ubcd1\uc6d0 -> \uc790\ud0dd \uc5d0\uc2a4\ucf54\ud2b8',
    status: 'WAITING' as ScheduleStatus,
    language: '\ud55c\uad6d\uc5b4',
    religion: 'CHRISTIAN' as Religion,
    notes: ['\ubcf5\uc57d\uc9c0\ub3c4 \ud544\uc694', '\ud720\uccb4\uc5b4 \ub3d9\ud589', '\ubcf4\ud638\uc790 \uc804\ud654 \ubcf4\uace0'],
  },
  {
    id: 2,
    time: '15:00 - 18:00',
    type: 'MEDICAL_TOURISM_CONCIERGE' as EscortType,
    patient: 'John Doe',
    condition: '\ubbf8\uad6d\uc778 \uc678\ub798 \ud658\uc790',
    location: '\uc2e0\uc0ac\ub3d9 OO \uc131\ud615\uc678\uacfc -> \ud638\ud154 \uac00\uc774\ub4dc',
    status: 'COMPLETED' as ScheduleStatus,
    language: '\uc601\uc5b4 \ud1b5\uc5ed \ud544\uc694',
    religion: 'NONE' as Religion,
    notes: ['\ud638\ud154 \ud53d\uc5c5', '\uc57d\uad6d \ub3d9\ud589', '\uc601\ubb38 \ubcf5\uc57d \uc548\ub0b4'],
  },
];

function formatKRW(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

export default function CureLinkProviderHome() {
  const [schedules] = useState(todaySchedules);

  const activeScheduleCount = useMemo(
    () => schedules.filter((schedule) => schedule.status !== 'COMPLETED').length,
    [schedules],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-900 px-5 pb-8 pt-5 text-white shadow-xl shadow-slate-900/20">
        <header className="mx-auto mb-7 flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/30">
              <HeartPulse className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-white">CureLink</p>
              <p className="text-xs font-medium text-slate-400">{TEXT.providerHome}</p>
            </div>
          </div>

          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3.5 text-xs font-bold text-slate-100 transition hover:bg-slate-700 active:scale-95"
            aria-label={TEXT.openLanguage}
          >
            <Globe2 className="h-4 w-4 text-sky-400" aria-hidden="true" />
            {provider.languageLabel}
          </button>
        </header>

        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500 text-2xl font-black text-white shadow-inner">
              {provider.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-slate-900 bg-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-900" aria-hidden="true" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs font-bold text-sky-300">
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                {MAPPING_DICTIONARY.tier[provider.tier]}
              </span>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                {provider.tierCode}
              </span>
            </div>

            <h1 className="text-[22px] font-black leading-tight tracking-tight">
              {provider.name} {TEXT.crewSuffix}
            </h1>
            <p className="mt-1 max-w-[280px] text-sm leading-5 text-slate-300">{TEXT.welcome}</p>
          </div>
        </div>
      </section>

      <section className="-mt-5 px-5">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                <CircleDollarSign className="h-4 w-4 text-sky-500" aria-hidden="true" />
                {TEXT.withdrawableAmount}
              </p>
              <div className="mt-2 flex items-end gap-1">
                <strong className="text-3xl font-black tracking-tight text-slate-950">
                  {formatKRW(provider.availableAmount)}
                </strong>
                <span className="pb-1 text-sm font-bold text-slate-500">{TEXT.won}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-sky-50 px-3 py-2 text-right">
              <p className="text-xs font-bold text-slate-500">{TEXT.safetyScore}</p>
              <p className="text-lg font-black text-sky-600">{provider.safetyScore}</p>
            </div>
          </div>

          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-base font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 active:scale-95"
          >
            {TEXT.requestSettlement}
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="px-5 pb-10 pt-7">
        <div className="mx-auto max-w-md">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-bold text-sky-600">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {TEXT.todaySchedule}
              </p>
              <h2 className="text-xl font-black tracking-tight text-slate-950">{TEXT.todayCare}</h2>
            </div>

            <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
              {TEXT.activeCount} {activeScheduleCount}
              {TEXT.cases}
            </span>
          </div>

          <div className="space-y-4">
            {schedules.map((schedule) => {
              const isCompleted = schedule.status === 'COMPLETED';

              return (
                <article
                  key={schedule.id}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {MAPPING_DICTIONARY.type[schedule.type]}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {MAPPING_DICTIONARY.status[schedule.status]}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                    <Clock3 className="h-4 w-4 text-sky-500" aria-hidden="true" />
                    {schedule.time}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-black leading-tight text-slate-950">
                      {schedule.patient}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {schedule.condition}
                    </p>
                  </div>

                  <div className="mb-4 flex gap-2 rounded-2xl bg-slate-50 p-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                    <p className="text-sm font-bold leading-5 text-slate-700">
                      {schedule.location}
                    </p>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                        {TEXT.language}
                      </p>
                      <p className="text-sm font-black text-slate-800">{schedule.language}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <UserRoundCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {TEXT.preferredReligion}
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        {MAPPING_DICTIONARY.religion[schedule.religion]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {schedule.notes.map((note) => (
                      <span
                        key={note}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600"
                      >
                        #{note}
                      </span>
                    ))}
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white transition hover:bg-slate-800 active:scale-95"
                    >
                      {TEXT.detailAndLog}
                      <ChevronRight className="h-5 w-5 text-sky-300" aria-hidden="true" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
