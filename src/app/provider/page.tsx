'use client';

import Link from 'next/link';
import {
  Award,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Clock,
  HeartPulse,
  MapPin,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import MatchApiTester from '@/components/provider/MatchApiTester';
import {
  CURE_LINK_MAPPING,
  type CareTag,
  type CareType,
  type MatchStatus,
  type Religion,
} from '@/constants/mapping';

const TEXT = {
  scheduler: '\uc2dc\uac04 \uc124\uc815',
  crewSuffix: '\ud06c\ub8e8\ub2d8',
  withdrawableAmount: '\ucd9c\uae08 \uac00\ub2a5 \uae08\uc561',
  won: '\uc6d0',
  safetyScore: '\uc548\uc804 \uc810\uc218',
  todayCare: '\uc624\ub298\uc758 \uc5d0\uc2a4\ucf54\ud2b8/\ub3cc\ubd04',
  cases: '\uac74',
  detailAndLog: '\uc77c\uc9c0 \uc791\uc131 \ubc0f \uc0c1\uc138 \ubcf4\uae30',
};

const provider = {
  name: 'Alex Kim',
  tier: 'GOLD CREW',
  availableAmount: 125000,
  language: 'EN / KO',
  safetyScore: 98,
};

const todayMatches: Array<{
  id: string;
  time: string;
  type: CareType;
  patientName: string;
  patientDetails: string;
  location: string;
  religion: Religion;
  tags: CareTag[];
  status: MatchStatus;
}> = [
  {
    id: 'match-001',
    time: '09:00 - 13:00',
    type: 'BRIDGE',
    patientName: '\uae40OO \uc5b4\ub974\uc2e0',
    patientDetails: '\uace0\uad00\uc808 \uc218\uc220 \ud1f4\uc6d0 \ud658\uc790',
    location: '\uac15\ub0a8\uc138\ube0c\ub780\uc2a4 \ubcd1\uc6d0 -> \ub300\uce58\ub3d9 \uc790\ud0dd',
    religion: 'CHRISTIAN',
    tags: ['MEDICATION', 'WHEELCHAIR'],
    status: 'MATCHED',
  },
  {
    id: 'match-002',
    time: '15:00 - 18:00',
    type: 'TOURISM',
    patientName: 'John Doe',
    patientDetails: '\ubbf8\uad6d\uc778 \uc678\ub798 \ud658\uc790',
    location: '\uc2e0\uc0ac\ub3d9 OO \uc131\ud615\uc678\uacfc -> \ud638\ud154',
    religion: 'NONE',
    tags: ['TRANSLATION', 'PICKUP', 'PHARMACY'],
    status: 'ONGOING',
  },
];

function formatKRW(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

export default function ProviderHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-900 antialiased">
      <header className="rounded-b-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/25">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-2xl font-black tracking-tight text-white">CureLink</span>
          </div>

          <Link
            href="/provider/scheduler"
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 text-xs font-black text-slate-300 transition active:scale-95"
          >
            <Calendar className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            {TEXT.scheduler}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-500 text-2xl font-black text-white">
              {provider.name[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-slate-950 bg-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-950" aria-hidden="true" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex w-fit items-center gap-1 rounded-md border border-sky-800/60 bg-sky-950/80 px-2 py-0.5 text-[10px] font-black text-sky-400">
              <Award className="h-3 w-3" aria-hidden="true" />
              {provider.tier}
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {provider.name} {TEXT.crewSuffix}
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">{provider.language}</p>
          </div>
        </div>
      </header>

      <section className="-mt-5 px-5">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                <CircleDollarSign className="h-4 w-4 text-sky-500" aria-hidden="true" />
                {TEXT.withdrawableAmount}
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {formatKRW(provider.availableAmount)}
                <span className="ml-1 text-sm font-bold text-slate-500">{TEXT.won}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 px-3 py-2 text-right">
              <p className="text-xs font-bold text-slate-500">{TEXT.safetyScore}</p>
              <p className="text-lg font-black text-sky-600">{provider.safetyScore}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-md px-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-black text-sky-600">Today Schedule</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              {TEXT.todayCare}
            </h2>
          </div>
          <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
            {todayMatches.length}
            {TEXT.cases}
          </span>
        </div>

        <div className="space-y-4">
          {todayMatches.map((match) => {
            const statusConfig = CURE_LINK_MAPPING.STATUS[match.status];

            return (
              <article
                key={match.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {match.time}
                  </span>
                </div>

                <p className="mb-2 text-xs font-black text-sky-600">
                  {CURE_LINK_MAPPING.CARE_TYPE[match.type]}
                </p>
                <h3 className="text-lg font-black text-slate-900">{match.patientName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{match.patientDetails}</p>

                <div className="mt-4 flex gap-2 rounded-2xl bg-slate-50 p-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  <p className="text-sm font-bold leading-5 text-slate-700">{match.location}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    #{CURE_LINK_MAPPING.RELIGION[match.religion]}
                  </span>
                  {match.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600"
                    >
                      #{CURE_LINK_MAPPING.TAGS[tag]}
                    </span>
                  ))}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Link
                    href={`/provider/log?id=${match.id}`}
                    className="flex min-h-12 w-full items-center justify-center gap-1 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition active:scale-95"
                  >
                    <UserRoundCheck className="h-4 w-4 text-sky-300" aria-hidden="true" />
                    {TEXT.detailAndLog}
                    <ChevronRight className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <MatchApiTester />
    </main>
  );
}
