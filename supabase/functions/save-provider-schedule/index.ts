import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SchedulePayload = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  local_timezone?: string;
  start_at_utc?: string;
  end_at_utc?: string;
};

type RequestBody = {
  provider_id?: string;
  schedules?: SchedulePayload[];
};

const DEMO_PROVIDER_ID = '00000000-0000-0000-0000-000000000101';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role environment variables are missing.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const { provider_id = DEMO_PROVIDER_ID, schedules = [] } = (await req.json()) as RequestBody;

    if (!Array.isArray(schedules)) {
      return jsonResponse({ success: false, error: 'schedules must be an array.' }, 400);
    }

    const supabase = createServiceClient();

    const { error: deleteError } = await supabase
      .from('provider_schedules')
      .delete()
      .eq('provider_id', provider_id);

    if (deleteError) throw deleteError;

    const rows = schedules.map((schedule) => ({
      provider_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      local_timezone: schedule.local_timezone ?? 'Asia/Seoul',
      start_at_utc: schedule.start_at_utc ?? null,
      end_at_utc: schedule.end_at_utc ?? null,
      is_available: true,
    }));

    if (rows.length === 0) {
      return jsonResponse({ success: true, data: { count: 0, schedules: [] } });
    }

    const { data, error } = await supabase
      .from('provider_schedules')
      .insert(rows)
      .select('id, day_of_week, start_time, end_time, local_timezone, start_at_utc, end_at_utc');

    if (error) throw error;

    return jsonResponse({ success: true, data: { count: data?.length ?? 0, schedules: data ?? [] } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown schedule save error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
