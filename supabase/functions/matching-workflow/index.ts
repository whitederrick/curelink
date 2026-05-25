import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type WorkflowAction = 'propose' | 'accept' | 'timeout';

type WorkflowRequestBody = {
  action?: WorkflowAction;
  match_id?: string;
  provider_id?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json; charset=utf-8',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role environment variables are missing.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getOfferExpiry() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  return expiresAt.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const supabase = getSupabaseClient();
    const body = (await req.json()) as WorkflowRequestBody;

    if (!body.action || !body.match_id) {
      return jsonResponse({ success: false, error: 'action and match_id are required.' }, 400);
    }

    if (body.action === 'propose') {
      if (!body.provider_id) {
        return jsonResponse({ success: false, error: 'provider_id is required for propose.' }, 400);
      }

      const { data, error } = await supabase
        .from('match_logs')
        .update({
          provider_id: body.provider_id,
          status: 'PENDING',
          proposed_at: new Date().toISOString(),
          expires_at: getOfferExpiry(),
        })
        .eq('id', body.match_id)
        .select('id, provider_id, status, proposed_at, expires_at')
        .single();

      if (error) throw error;

      return jsonResponse({ success: true, data });
    }

    if (body.action === 'accept') {
      const { data: acceptedRows, error } = await supabase.rpc('accept_pending_match', {
        p_match_id: body.match_id,
      });

      if (error) throw error;

      const data = Array.isArray(acceptedRows) ? acceptedRows[0] : null;

      if (!data) {
        return jsonResponse({
          success: false,
          error: 'This matching offer is expired or no longer pending.',
        }, 409);
      }

      return jsonResponse({ success: true, data });
    }

    const { data, error } = await supabase
      .from('match_logs')
      .update({
        status: 'TIMEOUT',
        timed_out_at: new Date().toISOString(),
      })
      .eq('id', body.match_id)
      .eq('status', 'PENDING')
      .lte('expires_at', new Date().toISOString())
      .select('id, provider_id, status, timed_out_at')
      .maybeSingle();

    if (error) throw error;

    return jsonResponse({
      success: true,
      data,
      next_action: data ? 'Call match-api again and propose the next ranked provider.' : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown matching workflow error.';

    return jsonResponse({ success: false, error: message }, 500);
  }
});
