'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building,
  CheckCircle2,
  Clock,
  Globe2,
  MapPin,
  Phone,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  CURE_LINK_MAPPING,
  type CareType,
  type DataRegion,
  type MatchStatus,
  type Religion,
} from '@/constants/mapping';

const LATEST_BOOKING_STORAGE_KEY = 'curelink.latestBooking';

type BookingSnapshot = {
  id: string;
  care_type: CareType;
  patient_name: string;
  patient_note?: string;
  required_language: string;
  required_religion: Religion;
  requires_wheelchair: boolean;
  total_amount: number;
  status: string;
  data_region: DataRegion;
  currency_code: string;
  exchange_rate: number;
  location_district?: string;
  source_partner_code?: string | null;
  created_at?: string;
};

function formatAmount(amount: number, currencyCode: string) {
  return new Intl.NumberFormat('ko-KR').format(amount) + ` ${currencyCode}`;
}

function normalizeStatus(status: string): MatchStatus {
  if (status === 'PAYMENT_PENDING' || status === 'MATCHING') return 'PENDING';
  if (status in CURE_LINK_MAPPING.STATUS) return status as MatchStatus;
  return 'PENDING';
}

function getLanguageLabel(language: string) {
  const labels: Record<string, string> = {
    ko: '한국어',
    en: 'English',
    vi: 'Tiếng Việt',
    zh: '中文',
  };

  return labels[language] ?? language.toUpperCase();
}

export default function BookingSuccessPage() {
  const [booking, setBooking] = useState<BookingSnapshot | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('id');
    const rawSnapshot = window.sessionStorage.getItem(LATEST_BOOKING_STORAGE_KEY);

    if (!rawSnapshot) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawSnapshot) as BookingSnapshot;
      if (!bookingId || parsed.id === bookingId) {
        setBooking(parsed);
      }
    } catch {
      window.sessionStorage.removeItem(LATEST_BOOKING_STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const status = normalizeStatus(booking?.status ?? 'PENDING');
  const statusConfig = CURE_LINK_MAPPING.STATUS[status];
  const isCrewAssigned = status === 'MATCHED' || status === 'ONGOING' || status === 'COMPLETED';

  const scheduledLabel = useMemo(() => {
    if (!booking?.created_at) return '예약 접수 직후';
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Seoul',
    }).format(new Date(booking.created_at));
  }, [booking?.created_at]);

  if (isLoaded && !booking) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900 antialiased">
        <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-black tracking-tight">예약 정보를 다시 확인해 주세요</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            이 화면은 방금 생성한 예약 데이터를 기준으로 보여줍니다. 새 예약을 만들거나 관리자 화면에서
            실제 DB 상태를 확인할 수 있습니다.
          </p>
          <div className="mt-6 grid gap-2">
            <Link
              href="/book"
              className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition active:scale-95"
            >
              새 예약 만들기
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition active:scale-95"
            >
              관리자 대시보드 확인
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-900 antialiased">
      <section className="rounded-b-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-xl shadow-slate-950/10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-6 w-6 text-white stroke-[2.5]" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-black tracking-tight">안심 케어 예약이 접수되었습니다</h1>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-400">
          결제 대기 상태로 등록되었고, 운영자는 관리자 화면에서 바로 조회할 수 있습니다.
        </p>

        {booking && (
          <div className="mx-auto mt-4 flex w-fit items-center justify-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-400">
            <Globe2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            Data Region: {CURE_LINK_MAPPING.DATA_REGION[booking.data_region]}
          </div>
        )}
      </section>

      {booking && (
        <section className="mx-auto mt-6 max-w-md space-y-4 px-5">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                <ShieldCheck className="h-4 w-4 text-sky-500" aria-hidden="true" />
                예약 상태 관제
              </h2>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:bg-slate-200">
              <div className="relative text-xs">
                <span className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-sky-500" />
                <p className="font-black text-slate-900">예약 요청 접수</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{scheduledLabel}</p>
              </div>
              <div className="relative text-xs">
                <span className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300" />
                <p className="font-bold text-slate-500">결제 승인 및 크루 호출 대기</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  결제 승인 후 10분 수락 타임아웃 정책에 따라 최적 크루에게 순차 제안됩니다.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">
              배정 크루 상태
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-md">
                <UserRoundCheck className="h-5 w-5 text-sky-300" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-black text-slate-800">
                  {isCrewAssigned ? '전담 크루 배정 완료' : '전담 크루 배정 대기'}
                </h4>
                <p className="mt-0.5 text-xs font-bold leading-5 text-slate-400">
                  필요 언어 {getLanguageLabel(booking.required_language)} / 종교 선호{' '}
                  {CURE_LINK_MAPPING.RELIGION[booking.required_religion]}
                </p>
              </div>
              <a
                href="tel:1588-0000"
                className="rounded-2xl border border-slate-200 bg-slate-100 p-3 text-slate-700 transition active:scale-95"
                aria-label="CureLink 운영팀에 전화하기"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 text-xs font-bold text-slate-500 shadow-sm">
            <div className="flex items-center justify-between">
              <span>예약 번호</span>
              <span className="font-mono text-slate-700">{booking.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" aria-hidden="true" />
                연계 파트너
              </span>
              <span className="text-slate-700">{booking.source_partner_code ?? '직접 예약'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                접수 일시
              </span>
              <span className="text-slate-700">{scheduledLabel}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                서비스 유형
              </span>
              <span className="text-right text-slate-700">{CURE_LINK_MAPPING.CARE_TYPE[booking.care_type]}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>환자</span>
              <span className="text-right text-slate-700">{booking.patient_name}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="font-black text-slate-800">결제 예정 금액</span>
              <span className="text-base font-black text-sky-600">
                {formatAmount(booking.total_amount, booking.currency_code)}
              </span>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/book"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition active:scale-95"
            >
              새 예약
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition active:scale-95"
            >
              관리자 확인
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
