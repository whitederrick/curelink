import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TimeSlotId = 'SLOT_MORNING' | 'SLOT_AFTERNOON' | 'SLOT_NIGHT';
type LanguageCode = 'ko' | 'en' | 'vi' | 'zh' | string;
type Religion = 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'NONE' | string;

type MatchRequestBody = {
  required_day?: number;
  required_time_slot?: TimeSlotId;
  required_language?: LanguageCode;
  required_religion?: Religion;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json; charset=utf-8',
};

const SLOT_TIME_MAP: Record<TimeSlotId, { start: string; end: string }> = {
  SLOT_MORNING: { start: '09:00:00', end: '13:00:00' },
  SLOT_AFTERNOON: { start: '13:00:00', end: '18:00:00' },
  SLOT_NIGHT: { start: '18:00:00', end: '22:00:00' },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function validateRequestBody(body: MatchRequestBody) {
  const { required_day, required_time_slot, required_language } = body;

  if (!Number.isInteger(required_day) || required_day < 0 || required_day > 6) {
    return 'required_day must be an integer from 0 to 6.';
  }

  if (!required_time_slot || !(required_time_slot in SLOT_TIME_MAP)) {
    return 'required_time_slot must be SLOT_MORNING, SLOT_AFTERNOON, or SLOT_NIGHT.';
  }

  if (!required_language || typeof required_language !== 'string') {
    return 'required_language is required.';
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Method not allowed. Use POST.',
      },
      405,
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || (!supabaseServiceRoleKey && !supabaseAnonKey)) {
      return jsonResponse(
        {
          success: false,
          error: 'Supabase environment variables are missing.',
        },
        500,
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey ?? supabaseAnonKey ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      },
    );

    const body = (await req.json()) as MatchRequestBody;
    const validationError = validateRequestBody(body);

    if (validationError) {
      return jsonResponse(
        {
          success: false,
          error: validationError,
        },
        400,
      );
    }

    const {
      required_day,
      required_time_slot,
      required_language,
      required_religion,
    } = body as Required<Pick<MatchRequestBody, 'required_day' | 'required_time_slot' | 'required_language'>> &
      Pick<MatchRequestBody, 'required_religion'>;

    const targetTime = SLOT_TIME_MAP[required_time_slot];

    let query = supabaseClient
      .from('providers')
      .select(
        `
        id,
        name,
        avatar_url,
        tier,
        rating_avg,
        total_matches,
        languages_spoken,
        religion,
        provider_schedules!inner(
          day_of_week,
          start_time,
          end_time,
          is_available
        )
      `,
      )
      .eq('provider_schedules.day_of_week', required_day)
      .eq('provider_schedules.start_time', targetTime.start)
      .eq('provider_schedules.end_time', targetTime.end)
      .eq('provider_schedules.is_available', true)
      .contains('languages_spoken', [required_language]);

    if (required_religion && required_religion !== 'NONE') {
      query = query.eq('religion', required_religion);
    }

    const { data: matchedProviders, error } = await query
      .order('rating_avg', { ascending: false })
      .order('total_matches', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return jsonResponse({
      success: true,
      count: matchedProviders?.length ?? 0,
      data: matchedProviders ?? [],
      filters: {
        required_day,
        required_time_slot,
        required_language,
        required_religion: required_religion ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown matching API error.';

    return jsonResponse(
      {
        success: false,
        error: message,
      },
      500,
    );
  }
});
