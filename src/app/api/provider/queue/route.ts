import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/adminAuth';

type BookingQueueRow = {
  id: string;
  care_type: string;
  required_time_slot: string;
  required_language: string;
  required_religion: string;
  requires_wheelchair: boolean;
  patient_name: string;
  patient_note: string;
  total_amount: number;
  status: string;
  location_district: string | null;
  data_region: string;
  currency_code: string;
  source_partner_code: string | null;
  created_at: string;
};

function getServerSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for provider queue.');
  }

  return { supabaseUrl, serviceRoleKey };
}

function getServiceHeaders(serviceRoleKey: string) {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    'Content-Type': 'application/json',
  };

  if (serviceRoleKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }

  return headers;
}

export async function GET(req: Request) {
  try {
    const unauthorizedResponse = await requireAnyRole(req, ['PROVIDER', 'ADMIN']);
    if (unauthorizedResponse) return unauthorizedResponse;

    const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();
    const params = new URLSearchParams({
      select:
        'id,care_type,required_time_slot,required_language,required_religion,requires_wheelchair,patient_name,patient_note,total_amount,status,location_district,data_region,currency_code,source_partner_code,created_at',
      status: 'in.(PAYMENT_PENDING,PAID,MATCHING,PENDING)',
      order: 'created_at.desc',
      limit: '10',
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/booking_requests?${params.toString()}`, {
      headers: getServiceHeaders(serviceRoleKey),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }

    const data = (await response.json()) as BookingQueueRow[];
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provider queue error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
