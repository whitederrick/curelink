import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CurrencyQuoteBody = {
  amount_krw?: number;
  quote_currency?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_STATIC_RATES: Record<string, number> = {
  KRW: 1,
  USD: 0.00074,
  VND: 18.85,
  JPY: 0.116,
  EUR: 0.00068,
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

function roundCurrency(amount: number, currency: string) {
  if (currency === 'KRW' || currency === 'VND' || currency === 'JPY') return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const body = (await req.json()) as CurrencyQuoteBody;
    const amountKrw = body.amount_krw ?? 0;
    const quoteCurrency = (body.quote_currency ?? 'KRW').toUpperCase();

    if (amountKrw <= 0) {
      return jsonResponse({ success: false, error: 'amount_krw must be positive.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service role environment variables are missing.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: latestRate } = await supabase
      .from('fx_rate_snapshots')
      .select('id, exchange_rate, source, captured_at')
      .eq('quote_currency', quoteCurrency)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const exchangeRate = latestRate?.exchange_rate ?? DEFAULT_STATIC_RATES[quoteCurrency];
    if (!exchangeRate) {
      return jsonResponse({ success: false, error: `Unsupported quote currency: ${quoteCurrency}.` }, 400);
    }

    return jsonResponse({
      success: true,
      data: {
        base_currency: 'KRW',
        quote_currency: quoteCurrency,
        amount_krw: amountKrw,
        exchange_rate: exchangeRate,
        quoted_amount: roundCurrency(amountKrw * exchangeRate, quoteCurrency),
        fx_snapshot_id: latestRate?.id ?? null,
        source: latestRate?.source ?? 'STATIC_FALLBACK',
        captured_at: latestRate?.captured_at ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown currency quote error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
