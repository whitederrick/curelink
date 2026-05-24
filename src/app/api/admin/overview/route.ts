import { NextResponse } from 'next/server';

type TableResult = {
  bookings: unknown[];
  aiInsights: unknown[];
  emergencyEvents: unknown[];
  partners: unknown[];
  didCredentials: unknown[];
};

function getServerSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin screens.');
  }

  return { supabaseUrl, serviceRoleKey };
}

async function fetchTable(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  query = 'select=*&order=created_at.desc&limit=20',
) {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    'Content-Type': 'application/json',
  };

  if (serviceRoleKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table}: ${text || response.statusText}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();

    const [bookings, aiInsights, emergencyEvents, partners, didCredentials] = await Promise.all([
      fetchTable(supabaseUrl, serviceRoleKey, 'booking_requests'),
      fetchTable(supabaseUrl, serviceRoleKey, 'ai_agent_insights'),
      fetchTable(supabaseUrl, serviceRoleKey, 'emergency_events'),
      fetchTable(supabaseUrl, serviceRoleKey, 'partner_agencies', 'select=*&order=created_at.desc&limit=20'),
      fetchTable(supabaseUrl, serviceRoleKey, 'provider_did_credentials'),
    ]);

    const payload: TableResult = {
      bookings,
      aiInsights,
      emergencyEvents,
      partners,
      didCredentials,
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown admin overview error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
