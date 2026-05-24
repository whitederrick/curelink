'use client';

import { useState } from 'react';
import {
  CheckCircle,
  FileSearch,
  SlidersHorizontal,
  UserCheck,
  XCircle,
  Zap,
} from 'lucide-react';

const issueSeed = [
  {
    id: 'M-701',
    patient: '박OO 환자 (강남세브란스)',
    issue: '피크타임 크루 전원 거절로 2회 연속 매칭 실패',
    currentMultiplier: '1.2x',
    location: '강남구',
  },
  {
    id: 'M-705',
    patient: 'John Doe (의료관광객)',
    issue: "요청된 '영어+가톨릭' 조건을 모두 만족하는 크루가 인근에 없음",
    currentMultiplier: '1.0x',
    location: '서초구',
  },
];

const approvalSeed = [
  {
    id: 'B2B-301',
    name: 'Vita Medical Travel',
    type: 'AGENCY',
    document: '의료관광유치업 등록증.pdf',
    status: 'PENDING',
  },
  {
    id: 'CREW-809',
    name: 'Siti Aminah',
    type: 'CREW',
    document: '국제 간호/돌봄 교육 VC DID 검증완료',
    status: 'PENDING',
  },
];

export default function AdminOperationsPage() {
  const [pendingIssues, setPendingIssues] = useState(issueSeed);
  const [approvalQueue, setApprovalQueue] = useState(approvalSeed);

  const handleManualDispatch = (matchId: string) => {
    setPendingIssues((prev) => prev.filter((issue) => issue.id !== matchId));
  };

  const handleApprovePartner = (id: string) => {
    setApprovalQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item)),
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 antialiased">
      <header className="mb-6 flex flex-col gap-3 border-b border-slate-900 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-black text-white">
            <SlidersHorizontal className="h-5 w-5 text-sky-500" aria-hidden="true" />
            실무 오퍼레이션 관제 센터
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            운영팀이 AI 매칭을 수동 개입하고 글로벌 파트너/크루 검증을 처리하는 화면입니다.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-black text-slate-300">
            <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
            AI 매칭 예외 강제 개입 ({pendingIssues.length})
          </h2>

          {pendingIssues.length === 0 ? (
            <p className="py-12 text-center text-xs font-bold text-slate-500">
              현재 AI 에이전트가 모든 실시간 매칭을 자율 처리하고 있습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingIssues.map((issue) => (
                <article key={issue.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {issue.id} / {issue.location}
                    </span>
                    <span className="rounded border border-amber-900 bg-amber-950 px-2 py-0.5 text-[10px] font-black text-amber-400">
                      할증 {issue.currentMultiplier}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-200">{issue.patient}</h3>
                    <p className="mt-1 flex items-start gap-1 text-xs font-semibold leading-5 text-rose-400">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {issue.issue}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-900 pt-2">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-black text-slate-400 transition hover:bg-slate-800"
                    >
                      할증 1.5x 조정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualDispatch(issue.id)}
                      className="rounded-xl bg-sky-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-sky-600 active:scale-95"
                    >
                      크루 수동 배정
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-black text-slate-300">
            <UserCheck className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            글로벌 파트너십 및 크루 검증 심사
          </h2>

          <div className="space-y-3">
            {approvalQueue.map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{item.id}</span>
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

                {item.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={() => handleApprovePartner(item.id)}
                    className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-[11px] font-black text-slate-200 transition hover:bg-slate-800 active:scale-95"
                  >
                    승인 & API 활성화
                  </button>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-2 py-1 text-[11px] font-black text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    승인 완료
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
