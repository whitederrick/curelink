import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RegionRoutingBody = {
  customer_country_code?: string;
  requested_region?: 'KR' | 'US' | 'EU' | 'SEA';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EU_COUNTRIES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function inferRegion(countryCode: string) {
  const code = countryCode.toUpperCase();
  if (code === 'US') return 'US';
  if (EU_COUNTRIES.has(code)) return 'EU';
  if (['VN', 'TH', 'PH', 'ID', 'MY', 'SG', 'KH', 'LA', 'MM'].includes(code)) return 'SEA';
  return 'KR';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const body = (await req.json()) as RegionRoutingBody;
    const countryCode = (body.customer_country_code ?? 'KR').toUpperCase();
    const regionCode = body.requested_region ?? inferRegion(countryCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service role environment variables are missing.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: route, error } = await supabase
      .from('data_region_routes')
      .select('*')
      .eq('region_code', regionCode)
      .eq('is_active', true)
      .single();

    if (error || !route) {
      return jsonResponse({ success: false, error: `No active data route for ${regionCode}.` }, 404);
    }

    return jsonResponse({
      success: true,
      data: {
        customer_country_code: countryCode,
        data_region: route.region_code,
        storage_provider: route.storage_provider,
        storage_region: route.storage_region,
        privacy_framework: route.privacy_framework,
        sensitive_data_strategy:
          route.region_code === 'KR'
            ? 'STORE_ALLOWED_FIELDS_IN_PRIMARY_DB'
            : 'STORE_ONLY_EXTERNAL_ENCRYPTED_REFERENCE_IN_PRIMARY_DB',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown region routing error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
