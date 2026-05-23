import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RequestBody = {
  care_type?: 'BRIDGE' | 'TOURISM' | 'EMERGENCY';
  required_day?: number;
  required_time_slot?: string;
  required_language?: string;
  required_religion?: 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'NONE';
  requires_wheelchair?: boolean;
  patient_name?: string;
  patient_note?: string;
  total_amount?: number;
};

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

    if (!body.care_type || !body.patient_name || !body.total_amount) {
      return jsonResponse({ success: false, error: 'Booking type, patient name, and amount are required.' }, 400);
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('booking_requests')
      .insert({
        care_type: body.care_type,
        required_day: body.required_day ?? 1,
        required_time_slot: body.required_time_slot ?? 'SLOT_MORNING',
        required_language: body.required_language ?? 'ko',
        required_religion: body.required_religion ?? 'NONE',
        requires_wheelchair: body.requires_wheelchair ?? false,
        patient_name: body.patient_name.trim(),
        patient_note: body.patient_note?.trim() ?? '',
        total_amount: body.total_amount,
        status: 'PAYMENT_PENDING',
      })
      .select('*')
      .single();

    if (error) throw error;

    return jsonResponse({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown booking request error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
