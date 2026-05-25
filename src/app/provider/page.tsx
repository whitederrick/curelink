'use client';

import { useEffect, useMemo, useState } from 'react';
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

type ProviderQueueRow = {
  id: string;
  care_type: CareType;
  required_time_slot: 'SLOT_MORNING' | 'SLOT_AFTERNOON' | 'SLOT_NIGHT';
  required_language: string;
  required_religion: Religion;
  requires_wheelchair: boolean;
  patient_name: string;
  patient_note: string;
  total_amount: number;
  status: string;
  location_district: string | null;
  data_region: string;
  currency_code: string;
  source_partner_code: string | null;
  created_at: string;
};

const TEXT = {
  scheduler: '\uc2dc\uac04 \uc124\uc815',
  crewSuffix: '\ud06c\ub8e8\ub2d8',
  withdrawableAmount: '\ucd9c\uae08 \uac00\ub2a5 \uae08\uc561',
  won: '\uc6d0',
  safetyScore: '\uc548\uc804 \uc810\uc218',
  todayCare: '\uc624\ub298\uc758 \uc5d0\uc2a4\ucf54\ud2b8/\ub3cc\ubd04',
  cases: '\uac74',
  detailAndLog: '\uc77c\uc9c0 \uc791\uc131 \ubc0f \uc0c1\uc138 \ubcf4\uae30',
  loadingSchedule: '실제 예약 큐를 불러오는 중입니다.',
  emptySchedule: '아직 공급자에게 노출할 예약 요청이 없습니다.',
  liveQueue: 'Live Booking Queue',
};

const provider = {
  name: 'Alex Kim',
  tier: 'GOLD CREW',
  availableAmount: 125000,
  language: 'EN / KO',
  safetyScore: 98,
};

const demoMatches: Array<{
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

function normalizeBookingStatus(status: string): MatchStatus {
  if (status === 'MATCHED') return 'MATCHED';
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'CANCELED') return 'CANCELED';
  return 'PENDING';
}

function slotToTimeLabel(slot: ProviderQueueRow['required_time_slot']) {
  const labels: Record<ProviderQueueRow['required_time_slot'], string> = {
    SLOT_MORNING: '09:00 - 13:00',
    SLOT_AFTERNOON: '13:00 - 18:00',
    SLOT_NIGHT: '18:00 - 22:00',
  };

  return labels[slot] ?? '시간 협의';
}

function languageTag(language: string): CareTag | null {
  return language === 'ko' ? null : 'TRANSLATION';
}

function toScheduleCard(booking: ProviderQueueRow) {
  const tags: CareTag[] = [];
  const maybeLanguageTag = languageTag(booking.required_language);

  if (maybeLanguageTag) tags.push(maybeLanguageTag);
  if (booking.requires_wheelchair) tags.push('WHEELCHAIR');

  return {
    id: booking.id,
    time: slotToTimeLabel(booking.required_time_slot),
    type: booking.care_type,
    patientName: booking.patient_name,
    patientDetails: booking.patient_note || `${booking.data_region} 리전 / ${booking.currency_code} ${formatKRW(booking.total_amount)}`,
    location: booking.location_district ?? '상세 위치 확인 필요',
    religion: booking.required_religion,
    tags,
    status: normalizeBookingStatus(booking.status),
  };
}

export default function ProviderHomePage() {
  const [bookings, setBookings] = useState<ProviderQueueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProviderQueue() {
      try {
        const response = await fetch('/api/provider/queue', { cache: 'no-store' });
        const result = (await response.json()) as {
          success: boolean;
          data?: ProviderQueueRow[];
          error?: string;
        };

        if (!response.ok || !result.success) {
          throw new Error(result.error ?? 'Provider queue request failed.');
        }

        if (isMounted) setBookings(result.data ?? []);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : '예약 큐를 불러오지 못했습니다.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProviderQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  const todayMatches = useMemo(() => {
    if (bookings.length > 0) return bookings.map(toScheduleCard);
    if (errorMessage) return demoMatches;
    return [];
  }, [bookings]);

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

        <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-bold leading-5 text-slate-600">
          {isLoading
            ? TEXT.loadingSchedule
            : errorMessage
              ? `${errorMessage} 데모 일정으로 화면을 유지합니다.`
              : bookings.length === 0
                ? TEXT.emptySchedule
                : TEXT.liveQueue}
        </div>

        {todayMatches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-bold leading-6 text-slate-500">
            소비자 예약 화면에서 새 요청을 만들면 이곳에 즉시 표시됩니다.
          </div>
        ) : (
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
        )}
      </section>

      <MatchApiTester />
    </main>
  );
}
