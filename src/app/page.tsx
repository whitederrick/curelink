import Link from 'next/link';
import { ArrowRight, HeartPulse, ShieldCheck, UserRoundCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between">
        <div>
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
            <HeartPulse className="h-7 w-7" aria-hidden="true" />
          </div>

          <p className="text-sm font-black uppercase tracking-wide text-sky-600">CureLink MVP</p>
          <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight text-slate-950">
            환자의 회복과 크루의 시간을 연결합니다
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
            퇴원 브릿지 케어, 글로벌 메디컬 에스코트, 시니어 일상 돌봄을 위한 모바일 우선 플랫폼입니다.
          </p>
        </div>

        <div className="space-y-3 pb-4">
          <Link
            href="/provider"
            className="flex min-h-16 items-center justify-between rounded-3xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-950/20 transition active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <UserRoundCheck className="h-5 w-5 text-sky-400" aria-hidden="true" />
              <span className="font-black">공급자 홈으로 이동</span>
            </span>
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-black text-slate-800">
              <ShieldCheck className="h-4 w-4 text-sky-500" aria-hidden="true" />
              현재 구현된 MVP
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              공급자 홈, 주간 가용시간 설정, 원터치 돌봄 일지 작성 화면이 연결되어 있습니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
