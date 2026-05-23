export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    functionsUrl: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? '',
  };
}

export function assertSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey || !config.functionsUrl) {
    throw new Error('Supabase environment variables are missing.');
  }

  return config;
}
