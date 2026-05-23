import { assertSupabaseConfig } from '@/lib/supabase';

export type RequiredTimeSlot = 'SLOT_MORNING' | 'SLOT_AFTERNOON' | 'SLOT_NIGHT';

export type MatchApiRequest = {
  required_day: number;
  required_time_slot: RequiredTimeSlot;
  required_language: string;
  required_religion?: string;
};

export type MatchedProvider = {
  id: string;
  name: string;
  avatar_url: string | null;
  tier: string;
  rating_avg: number;
  total_matches: number;
  languages_spoken: string[];
  religion: string;
};

export type MatchApiResponse = {
  success: boolean;
  count: number;
  data: MatchedProvider[];
  error?: string;
};

export async function fetchMatchedProviders(payload: MatchApiRequest) {
  const { anonKey, functionsUrl } = assertSupabaseConfig();

  const response = await fetch(`${functionsUrl}/match-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as MatchApiResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'CureLink matching request failed.');
  }

  return result;
}
