'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  FileSearch,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  XCircle,
  Zap,
} from 'lucide-react';
import { CURE_LINK_MAPPING, type CareType, type MatchStatus } from '@/constants/mapping';
import { getStoredSession } from '@/lib/authApi';

type BookingRequest = {
  id: string;
  created_at?: string;
  status?: string;
  care_type?: CareType;
  required_language?: string;
  required_religion?: string;
  patient_name?: string;
  total_amount?: number;
  data_region?: string;
  location_district?: string;
  identity_verification_status?: string;
  legal_disclaimer_agreed?: boolean;
  source_partner_code?: string;
};

type AdminOverview = {
  bookings: BookingRequest[];
  aiInsights: Array<Record<string, unknown>>;
  emergencyEvents: Array<Record<string, unknown>>;
  partners: Array<Record<string, unknown>>;
  didCredentials: Array<Record<string, unknown>>;
};

function shortId(id?: string) {
  return id ? id.slice(0, 8) : '-';
}

export default function AdminOperationsPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [actionIds, setActionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadOverview = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = getStoredSession();
      const response = await fetch('/api/admin/overview', {
        cache: 'no-store',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? '운영 데이터를 불러오지 못했습니다.');
      }

      setOverview(result.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '운영 데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const runAdminAction = async (
    action: 'RESOLVE_BOOKING_ISSUE' | 'APPROVE_PARTNER' | 'APPROVE_DID_CREDENTIAL',
    id: string,
  ) => {
    setActionIds((prev) => [...prev, id]);
    setErrorMessage('');

    try {
      const session = getStoredSession();
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action, id }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? '관리자 작업 처리에 실패했습니다.');
      }

      if (action === 'RESOLVE_BOOKING_ISSUE') {
        setResolvedIds((prev) => [...prev, id]);
      } else {
        setApprovedIds((prev) => [...prev, id]);
      }

      await loadOverview();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '관리자 작업 처리 중 오류가 발생했습니다.');
    } finally {
      setActionIds((prev) => prev.filter((actionId) => actionId !== id));
    }
  };

  const issueBookings = useMemo(() => {
    return (overview?.bookings ?? [])
      .filter((booking) => !resolvedIds.includes(booking.id))
      .filter((booking) =>
        ['PAYMENT_PENDING', 'PENDING', 'MATCHING', 'TIMEOUT'].includes(booking.status ?? 'PAYMENT_PENDING')
        || booking.identity_verification_status === 'PENDING',
      )
      .slice(0, 8);
  }, [overview, resolvedIds]);

  const approvalItems = useMemo(() => {
    const partners = (overview?.partners ?? []).map((partner) => ({
      id: String(partner.id ?? partner.partner_code ?? ''),
      name: String(partner.name ?? partner.partner_code ?? '파트너'),
      type: 'AGENCY',
      document: `국가 ${partner.country_code ?? 'KR'} / 정산 ${partner.settlement_currency ?? 'KRW'}`,
      status: partner.is_active ? 'APPROVED' : 'PENDING',
    }));

    const credentials = (overview?.didCredentials ?? []).map((credential) => ({
      id: String(credential.id ?? credential.credential_hash ?? ''),
      name: String(credential.issuer_name ?? '크루 DID 자격'),
      type: 'CREW',
      document: String(credential.credential_type ?? 'CARE_TRAINING'),
      status: String(credential.verification_status ?? 'PENDING'),
    }));

    return [...partners, ...credentials].slice(0, 10);
  }, [overview]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 antialiased">
      <header className="mb-6 flex flex-col gap-3 border-b border-slate-900 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-black text-white">
            <SlidersHorizontal className="h-5 w-5 text-sky-500" aria-hidden="true" />
            실무 오퍼레이션 관제 센터
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            실제 예약 요청을 조회하고, 운영자가 AI 예외 상황을 수동 처리하는 화면입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 text-xs font-black text-slate-300 transition active:scale-95"
        >
          <RefreshCw className="h-4 w-4 text-sky-400" aria-hidden="true" />
          새로고침
        </button>
      </header>

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-rose-900 bg-rose-950/40 p-4 text-sm font-bold text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-black text-slate-300">
            <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
            실시간 예약 이슈 및 AI 개입 대기 ({issueBookings.length})
          </h2>

          {isLoading ? (
            <p className="py-12 text-center text-xs font-bold text-slate-500">예약 데이터를 불러오는 중입니다.</p>
          ) : issueBookings.length === 0 ? (
            <p className="py-12 text-center text-xs font-bold text-slate-500">
              현재 운영자가 개입해야 할 예약 이슈가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {issueBookings.map((booking) => {
                const status = (booking.status ?? 'PENDING') as MatchStatus;
                const statusConfig = CURE_LINK_MAPPING.STATUS[status] ?? CURE_LINK_MAPPING.STATUS.PENDING;

                return (
                  <article key={booking.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {shortId(booking.id)} / {booking.location_district ?? booking.data_region ?? 'KR'}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${statusConfig.color}`}>
                        {booking.status ?? 'PAYMENT_PENDING'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-200">
                        {booking.patient_name ?? '환자명 없음'} / {booking.care_type ? CURE_LINK_MAPPING.CARE_TYPE[booking.care_type] : '서비스 미지정'}
                      </h3>
                      <p className="mt-1 flex items-start gap-1 text-xs font-semibold leading-5 text-rose-400">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        언어 {booking.required_language ?? '-'} / 신원 {booking.identity_verification_status ?? 'NOT_REQUIRED'} / 면책동의 {booking.legal_disclaimer_agreed ? '완료' : '대기'}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-900 pt-2">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-slate-800"
                      >
                        할증 1.5x 검토
                      </button>
                      <button
                        type="button"
                        disabled={actionIds.includes(booking.id)}
                        onClick={() => void runAdminAction('RESOLVE_BOOKING_ISSUE', booking.id)}
                        className="rounded-xl bg-sky-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-sky-600 active:scale-95"
                      >
                        {actionIds.includes(booking.id) ? '처리 중' : '운영 처리 완료'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-black text-slate-300">
            <UserCheck className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            파트너 및 글로벌 크루 검증 대기열
          </h2>

          <div className="space-y-3">
            {approvalItems.length === 0 ? (
              <p className="py-12 text-center text-xs font-bold text-slate-500">심사 대기 항목이 없습니다.</p>
            ) : (
              approvalItems.map((item) => {
                const isApproved = item.status === 'APPROVED' || approvedIds.includes(item.id);

                return (
                  <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{shortId(item.id)}</span>
                        <span className="rounded border border-indigo-900 bg-indigo-950 px-1.5 py-0.5 text-[9px] font-black text-indigo-400">
                          {item.type}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-200">{item.name}</h3>
                      <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.document}
                      </p>
                    </div>

                    {!isApproved ? (
                      <button
                        type="button"
                        disabled={actionIds.includes(item.id)}
                        onClick={() =>
                          void runAdminAction(
                            item.type === 'AGENCY' ? 'APPROVE_PARTNER' : 'APPROVE_DID_CREDENTIAL',
                            item.id,
                          )
                        }
                        className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-[11px] font-black text-slate-200 transition hover:bg-slate-800 active:scale-95"
                      >
                        {actionIds.includes(item.id) ? '처리 중' : '승인 처리'}
                      </button>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-2 py-1 text-[11px] font-black text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        승인 완료
                      </span>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
