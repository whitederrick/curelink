import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type PartnerBookingBody = {
  partner_code?: string;
  external_booking_id?: string;
  care_type?: 'BRIDGE' | 'TOURISM' | 'EMERGENCY';
  required_day?: number;
  required_time_slot?: string;
  required_language?: string;
  required_religion?: 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'NONE';
  requires_wheelchair?: boolean;
  patient_name?: string;
  patient_note?: string;
  total_amount?: number;
  quoted_currency?: string;
  location_district?: string;
  hospital_code?: string;
  health_tags?: string[];
  legal_disclaimer_agreed?: boolean;
  metadata?: Record<string, unknown>;
};

type PartnerAgency = {
  id: string;
  partner_code: string;
  api_key_hash: string;
  commission_rate: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-curelink-partner-key',
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

function validateBooking(body: PartnerBookingBody) {
  if (!body.partner_code) return 'partner_code is required.';
  if (!body.external_booking_id) return 'external_booking_id is required.';
  if (!body.care_type) return 'care_type is required.';
  if (!body.patient_name?.trim()) return 'patient_name is required.';
  if (!body.total_amount || body.total_amount < 0) return 'total_amount must be positive.';
  return null;
}

async function logPartnerEvent(
  supabase: ReturnType<typeof createClient>,
  partnerAgencyId: string | null,
  eventType: string,
  externalBookingId: string | undefined,
  requestStatus = 'SUCCESS',
  errorMessage: string | null = null,
) {
  await supabase.from('partner_api_events').insert({
    partner_agency_id: partnerAgencyId,
    event_type: eventType,
    external_booking_id: externalBookingId ?? null,
    request_status: requestStatus,
    error_message: errorMessage,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  const supabase = createServiceClient();
  let partnerAgency: PartnerAgency | null = null;
  let body: PartnerBookingBody = {};

  try {
    body = (await req.json()) as PartnerBookingBody;
    const validationError = validateBooking(body);

    if (validationError) {
      return jsonResponse({ success: false, error: validationError }, 400);
    }

    const partnerApiKey = req.headers.get('x-curelink-partner-key');
    if (!partnerApiKey) {
      return jsonResponse({ success: false, error: 'x-curelink-partner-key header is required.' }, 401);
    }

    const { data: agency, error: agencyError } = await supabase
      .from('partner_agencies')
      .select('id, partner_code, api_key_hash, commission_rate')
      .eq('partner_code', body.partner_code)
      .eq('is_active', true)
      .single();

    if (agencyError || !agency) {
      await logPartnerEvent(supabase, null, 'PARTNER_AUTH_FAILED', body.external_booking_id, 'FAILED', 'Unknown or inactive partner.');
      return jsonResponse({ success: false, error: 'Unknown or inactive partner.' }, 401);
    }

    partnerAgency = agency as PartnerAgency;
    const incomingHash = await sha256Hex(partnerApiKey);

    if (incomingHash !== partnerAgency.api_key_hash) {
      await logPartnerEvent(supabase, partnerAgency.id, 'PARTNER_AUTH_FAILED', body.external_booking_id, 'FAILED', 'Invalid partner API key.');
      return jsonResponse({ success: false, error: 'Invalid partner API key.' }, 401);
    }

    const { data: booking, error: bookingError } = await supabase
      .from('booking_requests')
      .insert({
        partner_agency_id: partnerAgency.id,
        source_partner_code: partnerAgency.partner_code,
        external_booking_id: body.external_booking_id,
        care_type: body.care_type,
        required_day: body.required_day ?? 1,
        required_time_slot: body.required_time_slot ?? 'SLOT_MORNING',
        required_language: body.required_language ?? 'en',
        required_religion: body.required_religion ?? 'NONE',
        requires_wheelchair: body.requires_wheelchair ?? false,
        patient_name: body.patient_name?.trim(),
        patient_note: body.patient_note?.trim() ?? '',
        total_amount: body.total_amount,
        original_amount: body.total_amount,
        location_district: body.location_district ?? null,
        quoted_currency: body.quoted_currency ?? 'KRW',
        identity_verification_required: true,
        identity_verification_status: 'PENDING',
        legal_disclaimer_agreed: body.legal_disclaimer_agreed ?? false,
        legal_disclaimer_agreed_at: body.legal_disclaimer_agreed ? new Date().toISOString() : null,
        partner_metadata: {
          hospital_code: body.hospital_code ?? null,
          health_tags: body.health_tags ?? [],
          ...(body.metadata ?? {}),
        },
        status: 'PAYMENT_PENDING',
      })
      .select('id, source_partner_code, external_booking_id, status, total_amount, quoted_currency, created_at')
      .single();

    if (bookingError) throw bookingError;

    await logPartnerEvent(supabase, partnerAgency.id, 'PARTNER_BOOKING_CREATED', body.external_booking_id);

    return jsonResponse({
      success: true,
      data: booking,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown partner booking error.';

    await logPartnerEvent(
      supabase,
      partnerAgency?.id ?? null,
      'PARTNER_BOOKING_FAILED',
      body.external_booking_id,
      'FAILED',
      message,
    );

    return jsonResponse({ success: false, error: message }, 500);
  }
});
