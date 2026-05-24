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
  location_district?: string;
  identity_verification_required?: boolean;
  legal_disclaimer_agreed?: boolean;
  customer_country_code?: string;
  data_region?: 'KR' | 'US' | 'EU' | 'SEA';
  currency_code?: string;
  exchange_rate?: number;
  base_amount_krw?: number;
  encrypted_medical_passport_ref?: string;
  sensitive_profile_ref?: string;
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
        original_amount: body.total_amount,
        base_amount_krw: body.base_amount_krw ?? body.total_amount,
        customer_country_code: body.customer_country_code ?? 'KR',
        data_region: body.data_region ?? 'KR',
        currency_code: body.currency_code ?? 'KRW',
        exchange_rate: body.exchange_rate ?? 1,
        encrypted_medical_passport_ref: body.encrypted_medical_passport_ref ?? null,
        sensitive_profile_ref: body.sensitive_profile_ref ?? null,
        location_district: body.location_district ?? null,
        identity_verification_required: body.identity_verification_required ?? body.required_language !== 'ko',
        identity_verification_status: body.identity_verification_required || body.required_language !== 'ko' ? 'PENDING' : 'NOT_REQUIRED',
        legal_disclaimer_agreed: body.legal_disclaimer_agreed ?? false,
        legal_disclaimer_agreed_at: body.legal_disclaimer_agreed ? new Date().toISOString() : null,
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
