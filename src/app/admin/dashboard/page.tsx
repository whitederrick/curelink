'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  FileCheck,
  Layers,
  ShieldAlert,
  Users2,
} from 'lucide-react';

const alertsSeed = [
  {
    id: 'M-701',
    hospital: '강남세브란스',
    patient: '박OO 환자',
    risk: 85,
    cause: '식사량 급감 및 수술 부위 부종 의심 신호 감지',
    type: 'MEDICAL',
  },
  {
    id: 'M-702',
    hospital: '서울성모병원',
    patient: 'Nguyen 환자',
    risk: 92,
    cause: '여권 OCR 성명과 예약 성명 불일치로 매칭 보류',
    type: 'LEGAL',
  },
];

const trafficSeed = [
  { id: 'TX-1092', region: 'KR', type: 'BRIDGE', lang: 'KO', security: 'RLS_SECURE', status: 'ONGOING' },
  { id: 'TX-1093', region: 'US', type: 'TOURISM', lang: 'EN', security: 'HIPAA_REF', status: 'PENDING' },
  { id: 'TX-1094', region: 'SEA', type: 'TOURISM', lang: 'VI', security: 'VAULT_REF', status: 'COMPLETED' },
];

export default function AdminControlTower() {
  const [systemStats] = useState({
    activeCrews: 1420,
    todayMatchSuccessRate: 98.4,
    aiAgentAutomationRate: 92.1,
  });
  const [aiAlerts] = useState(alertsSeed);
  const [coreLiveTraffic] = useState(trafficSeed);

  return (
    <main className="min-h-screen bg-slate-950 pb-12 text-slate-100 antialiased">
      <header className="flex flex-col gap-4 border-b border-slate-900 bg-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-400">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-black tracking-tight text-white">
              CureLink 중앙 작전 통제실
              <span className="rounded border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-400">
                HQ ADMIN
              </span>
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              AI 에이전트 자율 관제, 글로벌 리전, RLS 보안 상태를 통합 모니터링합니다.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400">
          시스템 상태: <span className="text-emerald-400">정상</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-rose-400">
            <Brain className="h-4 w-4" aria-hidden="true" />
            AI Agent 실시간 이상 징후
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {aiAlerts.map((alert) => (
              <article key={alert.id} className="rounded-3xl border border-rose-950 bg-slate-900 p-5 shadow-lg shadow-rose-950/5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-400">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{alert.id}</span>
                      <span className="rounded border border-rose-900/40 bg-rose-950/60 px-2 py-0.5 text-xs font-black text-rose-400">
                        {alert.type} Critical
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-200">
                      {alert.patient} <span className="text-xs font-medium text-slate-400">({alert.hospital})</span>
                    </h3>
                    <p className="text-xs font-semibold leading-5 text-slate-400">{alert.cause}</p>
                    <div className="pt-2 text-xs font-black text-rose-400">위험도 {alert.risk}%</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['활성 가용 크루', `${systemStats.activeCrews.toLocaleString()}명`, Users2, 'text-slate-300'],
            ['금일 매칭 성공률', `${systemStats.todayMatchSuccessRate}%`, BarChart3, 'text-emerald-400'],
            ['AI 자동 해결률', `${systemStats.aiAgentAutomationRate}%`, Brain, 'text-sky-400'],
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

        <section className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-300">
              <Layers className="h-4 w-4 text-sky-500" aria-hidden="true" />
              글로벌 리전 및 보안 무결성 트래픽
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-950 text-slate-500">
                <tr>
                  {['트랜잭션', '리전', '유형', '언어', '보안 상태', '상태'].map((head) => (
                    <th key={head} className="p-4 font-black">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-400">
                {coreLiveTraffic.map((traffic) => (
                  <tr key={traffic.id} className="hover:bg-slate-950/40">
                    <td className="p-4 font-mono text-slate-500">{traffic.id}</td>
                    <td className="p-4 font-black text-slate-300">{traffic.region}</td>
                    <td className="p-4">{traffic.type}</td>
                    <td className="p-4">{traffic.lang}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-indigo-400">
                        <FileCheck className="h-3 w-3" aria-hidden="true" />
                        {traffic.security}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-black text-sky-400">
                        {traffic.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
