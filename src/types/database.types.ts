export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProviderScheduleRow = {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

export type MatchLogInsert = {
  match_id: string;
  meal_status: 'GOOD' | 'FAIR' | 'POOR';
  condition_status: 'GOOD' | 'NORMAL' | 'BAD';
  medication_checked: boolean;
  raw_log_lang: 'ko' | 'en' | 'vi' | 'zh';
  raw_log_text: string;
};
