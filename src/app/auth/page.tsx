'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, HeartPulse, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
import {
  clearStoredSession,
  getStoredSession,
  signInWithEmail,
  signUpWithEmail,
  type CureLinkSession,
} from '@/lib/authApi';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<CureLinkSession | null>(null);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      const result =
        mode === 'signin'
          ? await signInWithEmail(email.trim(), password)
          : await signUpWithEmail(email.trim(), password);

      setSession(getStoredSession());
      setMessage(
        result.access_token
          ? '로그인 세션이 저장되었습니다.'
          : '회원가입 요청이 완료되었습니다. Supabase 이메일 확인 설정에 따라 확인 메일이 갈 수 있습니다.',
      );
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : '인증 처리에 실패했습니다.';
      setErrorMessage(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    clearStoredSession();
    setSession(null);
    setMessage('로그아웃했습니다.');
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-md">
        <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-sky-300">CureLink Auth</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            계정으로 안전하게 연결하기
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
            공급자와 보호자 데이터를 분리하기 위한 Supabase Auth 기반 인증 화면입니다.
          </p>
        </header>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {session ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-emerald-700">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  로그인 세션 보관 중
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {session.user?.email ?? email}
                </p>
              </div>

              <Link
                href="/provider"
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white transition active:scale-95"
              >
                공급자 홈으로 이동
                <ArrowRight className="h-4 w-4 text-sky-300" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition active:scale-95"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                로그아웃
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {([
                  ['signin', '로그인'],
                  ['signup', '회원가입'],
                ] as Array<[AuthMode, string]>).map(([nextMode, label]) => (
                  <button
                    key={nextMode}
                    type="button"
                    onClick={() => {
                      setMode(nextMode);
                      setErrorMessage('');
                      setMessage('');
                    }}
                    className={`min-h-11 rounded-xl text-sm font-black transition ${
                      mode === nextMode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  이메일
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="crew@example.com"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  비밀번호
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="6자 이상"
                  minLength={6}
                  required
                />
              </label>

              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-base font-black text-white shadow-lg shadow-sky-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserPlus className="h-5 w-5" aria-hidden="true" />
                {isSubmitting ? '처리 중...' : mode === 'signin' ? '로그인하기' : '회원가입하기'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
