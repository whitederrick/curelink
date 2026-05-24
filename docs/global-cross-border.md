# CureLink Global Cross-Border Readiness

This document captures the first production-safe scaffolding for global expansion.
It is not a substitute for legal, tax, healthcare, or payments compliance review.

## Data Residency

The primary CureLink database now stores routing metadata for sensitive patient data:

- `data_region`: operational routing region such as `KR`, `US`, `EU`, or `SEA`
- `encrypted_medical_passport_ref`: reference to the encrypted record in the correct regional vault
- `sensitive_profile_ref`: reference to protected patient profile data outside the primary Korea DB

Use the `region-routing` Edge Function before creating an international booking.

```bash
curl -X POST https://rfsdjakhiphkbnmylxis.functions.supabase.co/region-routing \
  -H "Content-Type: application/json" \
  -d '{"customer_country_code":"US"}'
```

## Multi-Currency Quote

KRW remains the operating base currency for crew settlement. International bookings
can store:

- `currency_code`
- `exchange_rate`
- `base_amount_krw`
- `fx_snapshot_id`

Use the `currency-quote` Edge Function for a quote snapshot.

```bash
curl -X POST https://rfsdjakhiphkbnmylxis.functions.supabase.co/currency-quote \
  -H "Content-Type: application/json" \
  -d '{"amount_krw":190000,"quote_currency":"USD"}'
```

## Provider DID Credential

Provider profiles now support:

- `did_credential_hash`
- `did_issuer`
- `did_verified_at`
- `home_country`

Detailed credential history is stored in `provider_did_credentials`.

## Partner Booking Example

```bash
curl -X POST https://rfsdjakhiphkbnmylxis.functions.supabase.co/partner-booking \
  -H "Content-Type: application/json" \
  -H "x-curelink-partner-key: ck_test_medicaltour_demo_2026" \
  -d '{
    "partner_code":"MT_DEMO_SEA",
    "external_booking_id":"SEA-2026-0002",
    "care_type":"TOURISM",
    "required_language":"vi",
    "patient_name":"Nguyen A",
    "patient_note":"Hotel pickup after outpatient procedure.",
    "total_amount":140.6,
    "base_amount_krw":190000,
    "quoted_currency":"USD",
    "exchange_rate":0.00074,
    "customer_country_code":"VN",
    "data_region":"SEA",
    "encrypted_medical_passport_ref":"sea-vault://patients/opaque-token",
    "sensitive_profile_ref":"sea-vault://profiles/opaque-token",
    "location_district":"Gangnam-gu",
    "legal_disclaimer_agreed":true
  }'
```
