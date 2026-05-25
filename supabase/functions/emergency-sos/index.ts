import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type EmergencyRequestBody = {
  match_log_id?: string;
  booking_request_id?: string;
  crew_name?: string;
  patient_name?: string;
  current_latitude?: number;
  current_longitude?: number;
  emergency_memo?: string;
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

function runBackgroundTask(task: Promise<unknown>) {
  const runtime = globalThis as typeof globalThis & {
    EdgeRuntime?: {
      waitUntil?: (promise: Promise<unknown>) => void;
    };
  };

  if (runtime.EdgeRuntime?.waitUntil) {
    runtime.EdgeRuntime.waitUntil(task);
    return;
  }

  task.catch((error) => {
    console.error('Emergency background task failed', error);
  });
}

async function dispatchHospitalWebhook(params: {
  supabase: ReturnType<typeof createServiceClient>;
  emergencyEventId: string;
  webhookUrl: string;
  payload: Record<string, unknown>;
}) {
  try {
    const response = await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.payload),
    });

    await params.supabase
      .from('webhook_deliveries')
      .update({
        delivery_status: response.ok ? 'SUCCESS' : 'FAILED',
        response_status: response.status,
      })
      .eq('emergency_event_id', params.emergencyEventId)
      .eq('destination_type', 'HOSPITAL_WEBHOOK');
  } catch (webhookError) {
    const message = webhookError instanceof Error ? webhookError.message : 'Unknown webhook error.';

    await params.supabase
      .from('webhook_deliveries')
      .update({
        delivery_status: 'FAILED',
        error_message: message,
      })
      .eq('emergency_event_id', params.emergencyEventId)
      .eq('destination_type', 'HOSPITAL_WEBHOOK');
  }
}

async function scheduleGuardianAlert(params: {
  supabase: ReturnType<typeof createServiceClient>;
  guardianDeliveryId: string;
}) {
  await params.supabase
    .from('webhook_deliveries')
    .update({
      delivery_status: 'PENDING',
      error_message: 'Queued for guardian notification worker integration.',
    })
    .eq('id', params.guardianDeliveryId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Use POST.' }, 405);

  try {
    const body = (await req.json()) as EmergencyRequestBody;

    if ((!body.match_log_id && !body.booking_request_id) || !body.crew_name || !body.patient_name) {
      return jsonResponse({
        success: false,
        error: 'match_log_id or booking_request_id, crew_name, and patient_name are required.',
      }, 400);
    }

    if (typeof body.current_latitude !== 'number' || typeof body.current_longitude !== 'number') {
      return jsonResponse({
        success: false,
        error: 'current_latitude and current_longitude are required.',
      }, 400);
    }

    const supabase = createServiceClient();
    let hospitalCode: string | null = null;

    if (body.match_log_id) {
      const { data: matchLog } = await supabase
        .from('match_logs')
        .update({
          status: 'EMERGENCY',
          emergency_status: 'SOS_TRIGGERED',
          b2b_billing_status: 'PENDING_INVESTIGATION',
        })
        .eq('id', body.match_log_id)
        .select('hospital_code')
        .maybeSingle();

      hospitalCode = matchLog?.hospital_code ?? null;
    }

    if (body.booking_request_id) {
      const { data: booking } = await supabase
        .from('booking_requests')
        .select('partner_metadata')
        .eq('id', body.booking_request_id)
        .maybeSingle();

      hospitalCode = hospitalCode ?? booking?.partner_metadata?.hospital_code ?? null;
    }

    const { data: event, error: eventError } = await supabase
      .from('emergency_events')
      .insert({
        match_log_id: body.match_log_id ?? null,
        booking_request_id: body.booking_request_id ?? null,
        crew_name: body.crew_name,
        patient_name: body.patient_name,
        latitude: body.current_latitude,
        longitude: body.current_longitude,
        emergency_memo: body.emergency_memo ?? '',
      })
      .select('id, created_at')
      .single();

    if (eventError) throw eventError;

    let hospitalDelivery = null;

    if (hospitalCode) {
      const { data: hospitalWebhook } = await supabase
        .from('partner_hospital_webhooks')
        .select('webhook_url')
        .eq('hospital_code', hospitalCode)
        .eq('is_active', true)
        .maybeSingle();

      if (hospitalWebhook?.webhook_url) {
        const { data: delivery } = await supabase
          .from('webhook_deliveries')
          .insert({
            emergency_event_id: event.id,
            destination_type: 'HOSPITAL_WEBHOOK',
            destination_url: hospitalWebhook.webhook_url,
            delivery_status: 'PENDING',
          })
          .select('id, delivery_status')
          .single();

        hospitalDelivery = delivery;

        runBackgroundTask(dispatchHospitalWebhook({
          supabase,
          emergencyEventId: event.id,
          webhookUrl: hospitalWebhook.webhook_url,
          payload: {
            event: 'PATIENT_EMERGENCY_SOS',
            timestamp: new Date().toISOString(),
            curelink_emergency_event_id: event.id,
            curelink_match_log_id: body.match_log_id ?? null,
            curelink_booking_request_id: body.booking_request_id ?? null,
            patient_name: body.patient_name,
            assigned_crew: body.crew_name,
            gps: {
              latitude: body.current_latitude,
              longitude: body.current_longitude,
            },
            incident_report: body.emergency_memo ?? '',
          },
        }));
      }
    }

    const { data: guardianDelivery } = await supabase
      .from('webhook_deliveries')
      .insert({
        emergency_event_id: event.id,
        destination_type: 'GUARDIAN_ALERT_QUEUE',
        delivery_status: 'PENDING',
      })
      .select('id, delivery_status')
      .single();

    if (guardianDelivery?.id) {
      runBackgroundTask(scheduleGuardianAlert({
        supabase,
        guardianDeliveryId: guardianDelivery.id,
      }));
    }

    return jsonResponse({
      success: true,
      data: {
        emergency_event_id: event.id,
        created_at: event.created_at,
        hospital_delivery: hospitalDelivery,
        guardian_delivery: guardianDelivery,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown emergency SOS error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
