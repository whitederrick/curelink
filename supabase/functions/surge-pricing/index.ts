import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SurgeRequestBody = {
  booking_request_id?: string;
  location_district?: string;
  threshold_medium?: number;
  threshold_high?: number;
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

function calculateSurge(pendingRequests: number, mediumThreshold: number, highThreshold: number) {
  if (pendingRequests >= highThreshold) {
    return {
      multiplier: 1.5,
      bonus: 30000,
      reason: `HIGH_DEMAND_${pendingRequests}_PENDING`,
    };
  }

  if (pendingRequests >= mediumThreshold) {
    return {
      multiplier: 1.2,
      bonus: 15000,
      reason: `MEDIUM_DEMAND_${pendingRequests}_PENDING`,
    };
  }

  return {
    multiplier: 1,
    bonus: 0,
    reason: `NORMAL_DEMAND_${pendingRequests}_PENDING`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const body = (await req.json()) as SurgeRequestBody;

    if (!body.booking_request_id || !body.location_district) {
      return jsonResponse({
        success: false,
        error: 'booking_request_id and location_district are required.',
      }, 400);
    }

    const supabase = createServiceClient();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const mediumThreshold = body.threshold_medium ?? 5;
    const highThreshold = body.threshold_high ?? 10;

    const { count, error: countError } = await supabase
      .from('booking_requests')
      .select('id', { count: 'exact', head: true })
      .eq('location_district', body.location_district)
      .in('status', ['PAYMENT_PENDING', 'PAID', 'MATCHING'])
      .gte('created_at', thirtyMinutesAgo);

    if (countError) throw countError;

    const pendingRequests = count ?? 0;
    const surge = calculateSurge(pendingRequests, mediumThreshold, highThreshold);

    const { data: booking, error: bookingError } = await supabase
      .from('booking_requests')
      .select('id, total_amount, original_amount')
      .eq('id', body.booking_request_id)
      .single();

    if (bookingError) throw bookingError;

    const baseAmount = booking.original_amount ?? booking.total_amount;
    const updatedAmount = Math.round(baseAmount * surge.multiplier);

    const { data: updatedBooking, error: updateError } = await supabase
      .from('booking_requests')
      .update({
        original_amount: baseAmount,
        total_amount: updatedAmount,
        location_district: body.location_district,
        surge_multiplier: surge.multiplier,
        incentive_bonus: surge.bonus,
        surge_reason: surge.reason,
        surge_applied_at: surge.multiplier > 1 ? new Date().toISOString() : null,
      })
      .eq('id', body.booking_request_id)
      .select('id, total_amount, original_amount, surge_multiplier, incentive_bonus, surge_reason')
      .single();

    if (updateError) throw updateError;

    return jsonResponse({
      success: true,
      data: {
        pending_requests: pendingRequests,
        ...updatedBooking,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown surge pricing error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
