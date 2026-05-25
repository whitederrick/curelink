'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  UserRoundCheck,
} from 'lucide-react';
import {
  CURE_LINK_MAPPING,
  type CareTag,
  type CareType,
  type MatchStatus,
  type Religion,
} from '@/constants/mapping';
import { getStoredSession } from '@/lib/authApi';

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
  scheduler: '시간 설정',
  providerHome: '공급자 홈',
  signedInAs: '로그인 계정',
  todayCare: '오늘의 에스코트/돌봄',
  cases: '건',
  detailAndLog: '일지 작성 및 상세 보기',
  loadingSchedule: '실제 예약 큐를 불러오는 중입니다.',
  emptySchedule: '아직 공급자에게 호출된 예약 요청이 없습니다.',
  loginRequired: '로그인이 필요합니다. 공급자 계정으로 로그인한 뒤 다시 확인해 주세요.',
  roleRequired:
    '로그인은 완료됐지만 이 계정에 공급자 권한이 없습니다. Supabase Auth metadata에 role: PROVIDER 또는 ADMIN을 부여해 주세요.',
  liveQueue: 'Live Booking Queue',
};

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
    patientDetails:
      booking.patient_note || `${booking.data_region} 리전 / ${booking.currency_code} ${formatKRW(booking.total_amount)}`,
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
  const [accountLabel, setAccountLabel] = useState('로그인이 필요합니다');

  useEffect(() => {
    let isMounted = true;

    async function loadProviderQueue() {
      try {
        const session = getStoredSession();
        if (isMounted) setAccountLabel(session?.user?.email ?? '인증된 공급자');
        const response = await fetch('/api/provider/queue', {
          cache: 'no-store',
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const result = (await response.json()) as {
          success: boolean;
          data?: ProviderQueueRow[];
          error?: string;
        };

        if (!response.ok || !result.success) {
          if (response.status === 401) throw new Error(TEXT.loginRequired);
          if (response.status === 403) throw new Error(TEXT.roleRequired);
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
              CL
            </div>
          </div>

          <div>
            <div className="mb-1 flex w-fit items-center rounded-md border border-sky-800/60 bg-sky-950/80 px-2 py-0.5 text-[10px] font-black text-sky-400">
              {TEXT.signedInAs}
            </div>
            <h1 className="text-xl font-bold tracking-tight">{TEXT.providerHome}</h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">{accountLabel}</p>
          </div>
        </div>
      </header>

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
              ? errorMessage
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
              const logHref = `/provider/log?id=${encodeURIComponent(match.id)}&patient=${encodeURIComponent(
                match.patientName,
              )}&type=${encodeURIComponent(CURE_LINK_MAPPING.CARE_TYPE[match.type])}`;

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
                      href={logHref}
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
    </main>
  );
}
