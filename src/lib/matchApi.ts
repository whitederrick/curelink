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
  acceptance_rate?: number;
  no_show_count?: number;
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
  const { functionsUrl } = assertSupabaseConfig();

  const response = await fetch(`${functionsUrl}/match-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let result: MatchApiResponse;

  try {
    result = JSON.parse(responseText) as MatchApiResponse;
  } catch {
    throw new Error(responseText || 'Matching API returned a non-JSON response.');
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'CureLink matching request failed.');
  }

  return result;
}
