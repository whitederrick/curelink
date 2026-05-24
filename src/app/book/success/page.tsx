'use client';

import { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Clock,
  Globe2,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { CURE_LINK_MAPPING, type CareType, type MatchStatus } from '@/constants/mapping';

type BookingSuccessState = {
  id: string;
  careType: CareType;
  patientName: string;
  location: string;
  scheduledTimeLocal: string;
  status: MatchStatus;
  meta: {
    data_region: 'KR' | 'US' | 'EU' | 'SEA';
    currency_code: 'KRW' | 'USD' | 'VND';
    exchange_rate: number;
    hospital_code: string;
  };
  assignedCrew: {
    name: string;
    tier: string;
    phone: string;
    languages: string[];
    did_verified: boolean;
  };
  totalAmount: number;
};

function formatKRW(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

export default function BookingSuccessPage() {
  const [matchDetails] = useState<BookingSuccessState>({
    id: 'match-kr-2026-009',
    careType: 'BRIDGE',
    patientName: '김OO 어르신',
    location: '강남세브란스 병원 -> 대치동 자택 에스코트',
    scheduledTimeLocal: '2026-05-25 09:00',
    status: 'ONGOING',
    meta: {
      data_region: 'KR',
      currency_code: 'KRW',
      exchange_rate: 1,
      hospital_code: 'SEVERANCE_GA',
    },
    assignedCrew: {
      name: 'Alex Kim',
      tier: 'GOLD CREW',
      phone: '010-1234-5678',
      languages: ['KO', 'EN'],
      did_verified: true,
    },
    totalAmount: 95000,
  });

  const statusConfig = CURE_LINK_MAPPING.STATUS[matchDetails.status];

  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-900 antialiased">
      <section className="rounded-b-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-xl shadow-slate-950/10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-6 w-6 text-white stroke-[2.5]" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-black tracking-tight">안심 케어가 성공적으로 접수되었습니다</h1>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-400">
          CureLink 엔진이 안전한 일상 회복을 실시간으로 관제합니다.
        </p>

        <div className="mx-auto mt-4 flex w-fit items-center justify-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-400">
          <Globe2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          Data Region: {CURE_LINK_MAPPING.DATA_REGION[matchDetails.meta.data_region]}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-md space-y-4 px-5">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-slate-800">
              <ShieldCheck className="h-4 w-4 text-sky-500" aria-hidden="true" />
              라이브 케어 상태 관제
            </h2>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:bg-slate-200">
            <div className="relative text-xs">
              <span className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300" />
              <p className="font-bold text-slate-400">병원 인계 완료</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {matchDetails.meta.hospital_code} 원무/제휴 코드 기준 체크인 완료
              </p>
            </div>
            <div className="relative text-xs">
              <span className="absolute -left-[20px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-sm ring-4 ring-sky-500/10" />
              <p className="font-black text-slate-900">목적지 이동 중</p>
              <p className="mt-0.5 font-semibold text-sky-600">{matchDetails.location}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">
            나를 돕는 전담 큐어 크루
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-md">
              {matchDetails.assignedCrew.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="text-base font-black text-slate-800">{matchDetails.assignedCrew.name}</h4>
                {matchDetails.assignedCrew.did_verified && (
                  <span className="rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black text-indigo-600">
                    글로벌 자격 인증
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-bold text-slate-400">
                {matchDetails.assignedCrew.tier} / {matchDetails.assignedCrew.languages.join(', ')}
              </p>
            </div>
            <a
              href={`tel:${matchDetails.assignedCrew.phone}`}
              className="rounded-2xl border border-slate-200 bg-slate-100 p-3 text-slate-700 transition active:scale-95"
              aria-label="배정 크루에게 전화하기"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 text-xs font-bold text-slate-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span>예약 번호</span>
            <span className="font-mono text-slate-700">{matchDetails.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5" aria-hidden="true" />
              연계 제휴 기관
            </span>
            <span className="text-slate-700">강남세브란스</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              예약 일시
            </span>
            <span className="text-slate-700">{matchDetails.scheduledTimeLocal}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              서비스 유형
            </span>
            <span className="text-right text-slate-700">{CURE_LINK_MAPPING.CARE_TYPE[matchDetails.careType]}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-black text-slate-800">결제 금액 ({matchDetails.meta.currency_code})</span>
            <span className="text-base font-black text-sky-600">{formatKRW(matchDetails.totalAmount)}원</span>
          </div>
        </section>

        <Link
          href="/provider"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition active:scale-95"
        >
          공급자 데모 화면으로 이동
        </Link>
      </section>
    </main>
  );
}
