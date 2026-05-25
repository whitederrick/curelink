import { assertSupabaseConfig } from '@/lib/supabase';
import { getStoredSession } from '@/lib/authApi';

type EdgeResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function callCureLinkFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { functionsUrl } = assertSupabaseConfig();
  const session = getStoredSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${functionsUrl}/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let result: EdgeResponse<T>;

  try {
    result = JSON.parse(text) as EdgeResponse<T>;
  } catch {
    throw new Error(text || 'CureLink API returned a non-JSON response.');
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'CureLink API request failed.');
  }

  return result.data as T;
}
