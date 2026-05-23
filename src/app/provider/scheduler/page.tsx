import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import WeeklyScheduler from '@/components/provider/WeeklyScheduler';

export default function ProviderSchedulerPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-5 pt-5">
        <Link
          href="/provider"
          className="inline-flex min-h-10 items-center gap-1 rounded-full bg-white px-3 text-sm font-black text-slate-600 shadow-sm transition active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          공급자 홈
        </Link>
      </div>
      <WeeklyScheduler />
    </main>
  );
}
