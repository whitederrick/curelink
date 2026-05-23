import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RequestBody = {
  match_id?: string;
  provider_id?: string;
  meal_status?: 'GOOD' | 'FAIR' | 'POOR';
  condition_status?: 'GOOD' | 'NORMAL' | 'BAD';
  medication_checked?: boolean;
  raw_log_lang?: string;
  raw_log_text?: string;
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
    const body = (await req.json()) as RequestBody;

    if (!body.match_id || !body.meal_status || !body.condition_status || body.medication_checked === undefined) {
      return jsonResponse({ success: false, error: 'Required care log fields are missing.' }, 400);
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('match_logs')
      .insert({
        external_match_key: body.match_id,
        provider_id: body.provider_id ?? DEMO_PROVIDER_ID,
        status: 'COMPLETED',
        meal_status: body.meal_status,
        condition_status: body.condition_status,
        medication_checked: body.medication_checked,
        raw_log_lang: body.raw_log_lang ?? 'ko',
        raw_log_text: body.raw_log_text ?? '',
        completed_at: new Date().toISOString(),
      })
      .select('id, external_match_key, status, meal_status, condition_status, medication_checked, raw_log_lang, created_at')
      .single();

    if (error) throw error;

    return jsonResponse({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown care log submit error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
