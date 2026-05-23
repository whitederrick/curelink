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
import {
  CURE_LINK_MAPPING,
  type CareTag,
  type CareType,
  type MatchStatus,
  type Religion,
} from '@/constants/mapping';

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
    patientName: '김OO 어르신',
    patientDetails: '고관절 수술 퇴원 환자',
    location: '강남세브란스 병원 -> 대치동 자택',
    religion: 'CHRISTIAN',
    tags: ['MEDICATION', 'WHEELCHAIR'],
    status: 'MATCHED',
  },
  {
    id: 'match-002',
    time: '15:00 - 18:00',
    type: 'TOURISM',
    patientName: 'John Doe',
    patientDetails: '미국인 외래 환자',
    location: '신사동 OO 성형외과 -> 호텔',
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
            시간 설정
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
            <h1 className="text-xl font-bold tracking-tight">{provider.name} 크루님</h1>
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
                출금 가능 금액
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {formatKRW(provider.availableAmount)}
                <span className="ml-1 text-sm font-bold text-slate-500">원</span>
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 px-3 py-2 text-right">
              <p className="text-xs font-bold text-slate-500">안전 점수</p>
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
              오늘의 에스코트/돌봄
            </h2>
          </div>
          <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
            {todayMatches.length}건
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
                    일지 작성 및 상세 보기
                    <ChevronRight className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
