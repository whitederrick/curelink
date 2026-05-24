'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  FileCheck,
  Layers,
  RefreshCw,
  ShieldAlert,
  Users2,
} from 'lucide-react';
import { CURE_LINK_MAPPING, type CareType, type DataRegion, type MatchStatus } from '@/constants/mapping';

type BookingRequest = {
  id: string;
  created_at?: string;
  status?: string;
  care_type?: CareType;
  required_language?: string;
  required_religion?: string;
  patient_name?: string;
  total_amount?: number;
  quoted_currency?: string;
  currency_code?: string;
  data_region?: DataRegion;
  location_district?: string;
  source_partner_code?: string;
  external_booking_id?: string;
  identity_verification_status?: string;
  legal_disclaimer_agreed?: boolean;
};

type AiInsight = {
  id: string;
  booking_request_id?: string | null;
  match_id?: string | null;
  readmission_risk_score?: number;
  anomaly_detected?: boolean;
  severity?: string;
  anomaly_type?: string | null;
  ai_refined_summary_ko?: string | null;
  created_at?: string;
};

type AdminOverview = {
  bookings: BookingRequest[];
  aiInsights: AiInsight[];
  emergencyEvents: Array<Record<string, unknown>>;
  partners: Array<Record<string, unknown>>;
  didCredentials: Array<Record<string, unknown>>;
};

function formatAmount(amount?: number, currency = 'KRW') {
  if (typeof amount !== 'number') return '-';
  return `${new Intl.NumberFormat('ko-KR').format(amount)} ${currency}`;
}

function shortId(id?: string) {
  return id ? id.slice(0, 8) : '-';
}

export default function AdminControlTower() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadOverview = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/overview', { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? '관리자 데이터를 불러오지 못했습니다.');
      }

      setOverview(result.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '관리자 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const stats = useMemo(() => {
    const bookings = overview?.bookings ?? [];
    const activeBookings = bookings.filter((booking) =>
      ['PAYMENT_PENDING', 'PAID', 'MATCHING', 'PENDING', 'ONGOING'].includes(booking.status ?? ''),
    );
    const anomalyCount = (overview?.aiInsights ?? []).filter((insight) => insight.anomaly_detected).length;

    return {
      activeBookings: activeBookings.length,
      todayBookings: bookings.length,
      anomalyCount,
    };
  }, [overview]);

  const aiAlerts = (overview?.aiInsights ?? []).filter((insight) => insight.anomaly_detected).slice(0, 4);
  const bookings = overview?.bookings ?? [];

  return (
    <main className="min-h-screen bg-slate-950 pb-12 text-slate-100 antialiased">
      <header className="flex flex-col gap-4 border-b border-slate-900 bg-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-400">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-black tracking-tight text-white">
              CureLink 중앙 관제 대시보드
              <span className="rounded border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-400">
                HQ ADMIN
              </span>
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              실제 Supabase 예약, AI 인사이트, 글로벌 리전 상태를 조회합니다.
            </p>
          </div>
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

      <section className="mx-auto max-w-7xl space-y-6 p-6">
        {errorMessage && (
          <div className="rounded-3xl border border-rose-900 bg-rose-950/40 p-4 text-sm font-bold text-rose-200">
            {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['최근 예약', `${stats.todayBookings}건`, Users2, 'text-slate-300'],
            ['활성 예약', `${stats.activeBookings}건`, BarChart3, 'text-emerald-400'],
            ['AI 위험 경고', `${stats.anomalyCount}건`, Brain, 'text-sky-400'],
          ].map(([label, value, Icon, color]) => (
            <article key={label as string} className="flex items-center justify-between rounded-3xl border border-slate-900 bg-slate-900 p-5">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">{label as string}</p>
                <h3 className={`text-2xl font-black tracking-tight ${color as string}`}>{value as string}</h3>
              </div>
              <div className="rounded-2xl bg-slate-800 p-3 text-slate-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-rose-400">
            <Brain className="h-4 w-4" aria-hidden="true" />
            AI Agent 위험 경고
          </h2>
          {aiAlerts.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-sm font-bold text-slate-500">
              현재 AI 이상 징후가 없습니다. 일지를 제출하고 AI Agent API가 실행되면 이곳에 표시됩니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {aiAlerts.map((alert) => (
                <article key={alert.id} className="rounded-3xl border border-rose-950 bg-slate-900 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-400">
                      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {shortId(alert.booking_request_id ?? alert.match_id ?? alert.id)}
                        </span>
                        <span className="rounded border border-rose-900/40 bg-rose-950/60 px-2 py-0.5 text-xs font-black text-rose-400">
                          {alert.severity ?? 'WARNING'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-5 text-slate-400">
                        {alert.ai_refined_summary_ko ?? alert.anomaly_type ?? 'AI 경고 상세 내용 없음'}
                      </p>
                      <div className="pt-2 text-xs font-black text-rose-400">
                        위험도 {alert.readmission_risk_score ?? 0}%
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-300">
              <Layers className="h-4 w-4 text-sky-500" aria-hidden="true" />
              최근 예약 및 글로벌 리전 트래픽
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-950 text-slate-500">
                <tr>
                  {['예약 ID', '환자', '유형', '언어', '리전', '금액', '상태', '보안'].map((head) => (
                    <th key={head} className="p-4 font-black">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-400">
                {isLoading ? (
                  <tr>
                    <td className="p-4" colSpan={8}>예약 데이터를 불러오는 중입니다.</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td className="p-4" colSpan={8}>아직 조회되는 예약이 없습니다.</td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const status = (booking.status ?? 'PENDING') as MatchStatus;
                    const statusConfig = CURE_LINK_MAPPING.STATUS[status] ?? CURE_LINK_MAPPING.STATUS.PENDING;
                    const currency = booking.currency_code ?? booking.quoted_currency ?? 'KRW';

                    return (
                      <tr key={booking.id} className="hover:bg-slate-950/40">
                        <td className="p-4 font-mono text-slate-500">{shortId(booking.id)}</td>
                        <td className="p-4 font-black text-slate-200">{booking.patient_name ?? '-'}</td>
                        <td className="p-4">{booking.care_type ? CURE_LINK_MAPPING.CARE_TYPE[booking.care_type] : '-'}</td>
                        <td className="p-4">{booking.required_language ?? '-'}</td>
                        <td className="p-4">{booking.data_region ?? 'KR'}</td>
                        <td className="p-4">{formatAmount(booking.total_amount, currency)}</td>
                        <td className="p-4">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusConfig.color}`}>
                            {booking.status ?? 'PAYMENT_PENDING'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-indigo-400">
                            <FileCheck className="h-3 w-3" aria-hidden="true" />
                            {booking.identity_verification_status ?? 'NOT_REQUIRED'} / {booking.legal_disclaimer_agreed ? 'AGREED' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
