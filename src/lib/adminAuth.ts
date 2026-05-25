import { NextResponse } from 'next/server';

type SupabaseAuthUser = {
  app_metadata?: {
    role?: string;
    roles?: string[];
  };
  user_metadata?: {
    role?: string;
    roles?: string[];
  };
};

function getSupabaseAuthConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase auth environment variables are missing.');
  }

  return { supabaseUrl, anonKey };
}

function extractBearerToken(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');

  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

export async function requireAnyRole(req: Request, allowedRoles: string[]) {
  const token = extractBearerToken(req);
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase());

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { supabaseUrl, anonKey } = getSupabaseAuthConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const user = (await response.json()) as SupabaseAuthUser;

  const roleCandidates = [
    user.app_metadata?.role,
    user.user_metadata?.role,
    ...(user.app_metadata?.roles ?? []),
    ...(user.user_metadata?.roles ?? []),
  ];

  const hasAllowedRole = roleCandidates.some((role) =>
    role ? normalizedAllowedRoles.includes(role.toUpperCase()) : false,
  );

  if (!hasAllowedRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return null;
}

export async function requireAdminRole(req: Request) {
  return requireAnyRole(req, ['ADMIN']);
}
