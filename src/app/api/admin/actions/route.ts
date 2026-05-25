import { NextResponse } from 'next/server';

type AdminActionBody = {
  action?: 'RESOLVE_BOOKING_ISSUE' | 'APPROVE_PARTNER' | 'APPROVE_DID_CREDENTIAL';
  id?: string;
};

function getServerSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin actions.');
  }

  return { supabaseUrl, serviceRoleKey };
}

function buildServiceHeaders(serviceRoleKey: string) {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  if (serviceRoleKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }

  return headers;
}

async function patchById(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  id: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: buildServiceHeaders(serviceRoleKey),
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Failed to update ${table}.`);
  }

  return text ? JSON.parse(text) : [];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AdminActionBody;

    if (!body.action || !body.id) {
      return NextResponse.json(
        { success: false, error: 'action and id are required.' },
        { status: 400 },
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();

    if (body.action === 'RESOLVE_BOOKING_ISSUE') {
      const data = await patchById(supabaseUrl, serviceRoleKey, 'booking_requests', body.id, {
        status: 'MATCHING',
      });

      return NextResponse.json({ success: true, data });
    }

    if (body.action === 'APPROVE_PARTNER') {
      const data = await patchById(supabaseUrl, serviceRoleKey, 'partner_agencies', body.id, {
        is_active: true,
      });

      return NextResponse.json({ success: true, data });
    }

    if (body.action === 'APPROVE_DID_CREDENTIAL') {
      const data = await patchById(supabaseUrl, serviceRoleKey, 'provider_did_credentials', body.id, {
        verification_status: 'APPROVED',
        verified_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Unsupported admin action.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown admin action error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
