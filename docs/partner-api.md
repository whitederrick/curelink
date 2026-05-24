# CureLink Partner Booking API

의료관광 에이전시가 CureLink의 병원 밖 동행, 통역, 회복 케어 인프라를 예약 접수 시스템으로 연동하기 위한 API입니다.

## Positioning

CureLink는 병원 선택, 의료행위 알선, 진료 결정에 개입하지 않습니다. 이 API는 진료 전후의 이동, 통역, 회복 동행, 호텔/약국 동행 같은 비의료 운영 지원을 접수합니다.

## Demo Partner

- Partner code: `MT_DEMO_SEA`
- Test API key: `ck_test_medicaltour_demo_2026`

## Endpoint

```text
POST https://rfsdjakhiphkbnmylxis.functions.supabase.co/partner-booking
```

Required header:

```text
x-curelink-partner-key: ck_test_medicaltour_demo_2026
content-type: application/json
```

Example body:

```json
{
  "partner_code": "MT_DEMO_SEA",
  "external_booking_id": "SEA-2026-0001",
  "care_type": "TOURISM",
  "required_day": 1,
  "required_time_slot": "SLOT_MORNING",
  "required_language": "vi",
  "required_religion": "NONE",
  "requires_wheelchair": true,
  "patient_name": "Nguyen A",
  "patient_note": "Hotel pickup after outpatient procedure. Needs pharmacy escort.",
  "total_amount": 190000,
  "quoted_currency": "KRW",
  "hospital_code": "GANGNAM_SKIN_01",
  "health_tags": ["WHEELCHAIR", "PHARMACY"]
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": "booking uuid",
    "source_partner_code": "MT_DEMO_SEA",
    "external_booking_id": "SEA-2026-0001",
    "status": "PAYMENT_PENDING",
    "total_amount": 190000,
    "quoted_currency": "KRW",
    "created_at": "2026-05-24T00:00:00Z"
  }
}
```
