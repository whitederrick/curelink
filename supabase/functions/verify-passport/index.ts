import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type VerificationRequestBody = {
  booking_request_id?: string;
  match_log_id?: string;
  passport_number?: string;
  full_name_ocr?: string;
  expected_patient_name?: string;
  birth_date_ocr?: string;
  visa_type?: string;
  visa_expiry_date?: string;
  legal_disclaimer_agreed?: boolean;
  electronic_signature_svg?: string;
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

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeName(name: string) {
  return name.replace(/[^a-zA-Z]/g, '').toUpperCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const body = (await req.json()) as VerificationRequestBody;

    if ((!body.booking_request_id && !body.match_log_id) || !body.passport_number || !body.full_name_ocr || !body.visa_type) {
      return jsonResponse({
        success: false,
        error: 'booking_request_id or match_log_id, passport_number, full_name_ocr, and visa_type are required.',
      }, 400);
    }

    if (!body.legal_disclaimer_agreed) {
      return jsonResponse({
        success: false,
        error: 'Legal disclaimer agreement is required before matching.',
      }, 400);
    }

    const supabase = createServiceClient();
    const isIdentityMatched = body.expected_patient_name
      ? normalizeName(body.full_name_ocr).includes(normalizeName(body.expected_patient_name)) ||
        normalizeName(body.expected_patient_name).includes(normalizeName(body.full_name_ocr))
      : true;
    const visaExpiry = body.visa_expiry_date ? new Date(body.visa_expiry_date) : null;
    const isVisaValid = !visaExpiry || visaExpiry.getTime() >= Date.now();
    const status = isIdentityMatched && isVisaValid ? 'VERIFIED' : 'REJECTED';

    const { data, error } = await supabase
      .from('passport_verifications')
      .insert({
        booking_request_id: body.booking_request_id ?? null,
        match_log_id: body.match_log_id ?? null,
        passport_number_hashed: await sha256Hex(body.passport_number),
        full_name_ocr: body.full_name_ocr,
        birth_date_ocr: body.birth_date_ocr ?? null,
        visa_type: body.visa_type,
        visa_expiry_date: body.visa_expiry_date ?? null,
        is_identity_matched: isIdentityMatched,
        is_visa_valid: isVisaValid,
        legal_disclaimer_agreed: body.legal_disclaimer_agreed,
        electronic_signature_svg: body.electronic_signature_svg ?? null,
      })
      .select('id, booking_request_id, match_log_id, is_identity_matched, is_visa_valid, legal_disclaimer_agreed, verified_at')
      .single();

    if (error) throw error;

    if (body.booking_request_id) {
      await supabase
        .from('booking_requests')
        .update({
          identity_verification_required: true,
          identity_verification_status: status,
          legal_disclaimer_agreed: body.legal_disclaimer_agreed,
          legal_disclaimer_agreed_at: new Date().toISOString(),
        })
        .eq('id', body.booking_request_id);
    }

    return jsonResponse({
      success: true,
      data: {
        ...data,
        identity_verification_status: status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown passport verification error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
