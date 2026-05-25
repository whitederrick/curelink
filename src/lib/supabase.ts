export type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  functionsUrl: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    functionsUrl: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? '',
  };
}

export function assertSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();

  if (!config.supabaseUrl || !config.supabaseAnonKey || !config.functionsUrl) {
    throw new Error('Supabase environment variables are missing.');
  }

  return config;
}
