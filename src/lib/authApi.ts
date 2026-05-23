import { assertSupabaseConfig } from '@/lib/supabase';

export type CureLinkSession = {
  access_token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email?: string;
  };
};

const SESSION_STORAGE_KEY = 'curelink.session';

function getAuthHeaders() {
  const { anonKey } = assertSupabaseConfig();

  return {
    apikey: anonKey,
    'Content-Type': 'application/json',
  };
}

function saveSession(session: CureLinkSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null;

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as CureLinkSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function signUpWithEmail(email: string, password: string) {
  const { url } = assertSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.msg ?? result.error_description ?? '회원가입에 실패했습니다.');
  }

  if (result.access_token) {
    saveSession(result as CureLinkSession);
  }

  return result;
}

export async function signInWithEmail(email: string, password: string) {
  const { url } = assertSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.msg ?? result.error_description ?? '로그인에 실패했습니다.');
  }

  saveSession(result as CureLinkSession);

  return result as CureLinkSession;
}
