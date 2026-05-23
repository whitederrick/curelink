'use client';

import { useState } from 'react';
import { Loader2, Radar, Star, UsersRound } from 'lucide-react';
import { fetchMatchedProviders, type MatchApiResponse } from '@/lib/matchApi';

const TEXT = {
  title: '\ub9e4\uce6d API \uc5f0\uacb0 \ud14c\uc2a4\ud2b8',
  description:
    '\uc6d4\uc694\uc77c \uc624\uc804, \uc601\uc5b4, \uae30\ub3c5\uad50 \uc870\uac74\uc73c\ub85c Supabase Edge Function\uc744 \ud638\ucd9c\ud569\ub2c8\ub2e4.',
  button: '\uc2e4\uc2dc\uac04 \ub9e4\uce6d \uc2e4\ud589',
  loading: '\ub9e4\uce6d \uc911...',
  countSuffix: '\uba85 \ub9e4\uce6d',
  noResult: '\uc870\uac74\uc5d0 \ub9de\ub294 \ud06c\ub8e8\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.',
};

export default function MatchApiTester() {
  const [result, setResult] = useState<MatchApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const runMatch = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const nextResult = await fetchMatchedProviders({
        required_day: 1,
        required_time_slot: 'SLOT_MORNING',
        required_language: 'en',
        required_religion: 'CHRISTIAN',
      });

      setResult(nextResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown matching error.';
      setResult(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-md px-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Radar className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">{TEXT.title}</h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              {TEXT.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runMatch}
          disabled={isLoading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {TEXT.loading}
            </>
          ) : (
            <>
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              {TEXT.button}
            </>
          )}
        </button>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <p className="mb-3 text-sm font-black text-slate-800">
              {result.count}
              {TEXT.countSuffix}
            </p>

            {result.data.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                {TEXT.noResult}
              </p>
            ) : (
              <div className="space-y-2">
                {result.data.map((provider) => (
                  <div
                    key={provider.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{provider.name}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">
                          {provider.tier} / {provider.languages_spoken.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="flex items-center gap-1 text-sm font-black text-sky-600">
                          <Star className="h-3.5 w-3.5 fill-sky-500" aria-hidden="true" />
                          {provider.rating_avg}
                        </p>
                        <p className="text-xs font-bold text-slate-400">
                          {provider.total_matches}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
