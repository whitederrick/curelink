# CureLink

CureLink is a mobile-first provider dashboard prototype for discharge care, senior daily care, and global medical escort workflows.

## Current MVP

- Provider home dashboard
- Available settlement card
- Daily escort/care schedule cards
- Weekly availability scheduler
- One-touch care log form with translation-ready structure
- App Router routes for `/provider`, `/provider/scheduler`, and `/provider/log`
- Shared enum-to-label mapping dictionary under `src/constants`
- Supabase Edge Function matching API under `supabase/functions/match-api`

## Supabase Function

`match-api` accepts a POST body like:

```json
{
  "required_day": 1,
  "required_time_slot": "SLOT_MORNING",
  "required_language": "en",
  "required_religion": "CHRISTIAN"
}
```

It returns up to 10 available providers sorted by `rating_avg` and `total_matches`.

## Supabase Database

Core schema migrations live under `supabase/migrations`.

- `providers`
- `provider_schedules`
- `match_logs`

Apply them with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy match-api
```

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Lucide React

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
