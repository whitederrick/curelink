'use client';

import Link from 'next/link';
import { ChevronLeft, Globe } from 'lucide-react';
import WeeklyScheduler from '@/components/provider/WeeklyScheduler';
import { getDeviceTimeZone } from '@/utils/timezone-helper';

export default function ProviderSchedulerPage() {
  const currentTimeZone = getDeviceTimeZone();

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 pt-5">
        <Link
          href="/provider"
          className="inline-flex min-h-10 items-center gap-1 rounded-full bg-white px-3 text-sm font-black text-slate-600 shadow-sm transition active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          공급자 홈
        </Link>

        <div className="inline-flex min-h-10 max-w-[210px] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 shadow-sm">
          <Globe className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
          <span className="truncate">{currentTimeZone} 기준</span>
        </div>
      </div>

      <div className="mt-4">
        <WeeklyScheduler />
      </div>
    </main>
  );
}
