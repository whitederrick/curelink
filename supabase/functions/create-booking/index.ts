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

type CareType = NonNullable<RequestBody['care_type']>;
type Religion = NonNullable<RequestBody['required_religion']>;

const SERVER_PRICE_POLICY = {
  BASE: {
    BRIDGE: 80000,
    TOURISM: 150000,
    EMERGENCY: 120000,
  },
  PREMIUM_SURCHARGE: {
    TRANSLATION: 30000,
    WHEELCHAIR: 10000,
    CHRISTIAN: 5000,
    BUDDHIST: 5000,
    CATHOLIC: 5000,
    NONE: 0,
  },
} satisfies {
  BASE: Record<CareType, number>;
  PREMIUM_SURCHARGE: Record<Religion | 'TRANSLATION' | 'WHEELCHAIR', number>;
};

const SUPPORTED_TIME_SLOTS = new Set(['SLOT_MORNING', 'SLOT_AFTERNOON', 'SLOT_NIGHT']);

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

function createUserClient(authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase user auth environment variables are missing.');
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

function calculateBookingAmount(body: RequestBody) {
  if (!body.care_type || !(body.care_type in SERVER_PRICE_POLICY.BASE)) {
    throw new Error('Unsupported care type.');
  }

  let amount = SERVER_PRICE_POLICY.BASE[body.care_type];

  if (body.required_language && body.required_language !== 'ko') {
    amount += SERVER_PRICE_POLICY.PREMIUM_SURCHARGE.TRANSLATION;
  }

  if (body.requires_wheelchair) {
    amount += SERVER_PRICE_POLICY.PREMIUM_SURCHARGE.WHEELCHAIR;
  }

  const religion = body.required_religion ?? 'NONE';
  if (!(religion in SERVER_PRICE_POLICY.PREMIUM_SURCHARGE)) {
    throw new Error('Unsupported religion preference.');
  }

  amount += SERVER_PRICE_POLICY.PREMIUM_SURCHARGE[religion] ?? 0;

  return amount;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Missing Authorization header.' }, 401);
    }

    const body = (await req.json()) as RequestBody;

    if (!body.care_type || !body.patient_name) {
      return jsonResponse({ success: false, error: 'Booking type and patient name are required.' }, 400);
    }

    if (body.required_day !== undefined && (body.required_day < 0 || body.required_day > 6)) {
      return jsonResponse({ success: false, error: 'required_day must be between 0 and 6.' }, 400);
    }

    if (body.required_time_slot && !SUPPORTED_TIME_SLOTS.has(body.required_time_slot)) {
      return jsonResponse({ success: false, error: 'Unsupported required_time_slot.' }, 400);
    }

    const calculatedAmount = calculateBookingAmount(body);
    if (body.total_amount !== undefined && Number(body.total_amount) !== calculatedAmount) {
      return jsonResponse({ success: false, error: 'Price forgery detected. Transaction blocked.' }, 400);
    }

    const supabase = createUserClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ success: false, error: 'Invalid or expired token.' }, 401);
    }

    const { data, error } = await supabase
      .from('booking_requests')
      .insert({
        customer_id: user.id,
        care_type: body.care_type,
        required_day: body.required_day ?? 1,
        required_time_slot: body.required_time_slot ?? 'SLOT_MORNING',
        required_language: body.required_language ?? 'ko',
        required_religion: body.required_religion ?? 'NONE',
        requires_wheelchair: body.requires_wheelchair ?? false,
        patient_name: body.patient_name.trim(),
        patient_note: body.patient_note?.trim() ?? '',
        total_amount: calculatedAmount,
        original_amount: calculatedAmount,
        base_amount_krw: calculatedAmount,
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
