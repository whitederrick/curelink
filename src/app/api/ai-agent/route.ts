import { NextResponse } from 'next/server';
import { encryptSensitiveData } from '@/utils/crypto';

type CareLogPayload = {
  match_id?: string;
  booking_request_id?: string;
  raw_log_lang?: string;
  raw_log_text?: string;
  meal_status?: 'GOOD' | 'FAIR' | 'POOR';
  condition_status?: 'GOOD' | 'NORMAL' | 'BAD';
  medication_checked?: boolean;
};

function getServerSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server Supabase environment variables are missing.');
  }

  return { supabaseUrl, serviceRoleKey };
}

function maskPatientIdentifiers(text: string) {
  return text
    .replace(/\b\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, '[PHONE]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/\b\d{6}[-\s]?\d{7}\b/g, '[NATIONAL_ID]');
}

function buildMedicalReport(payload: CareLogPayload) {
  const rawText = payload.raw_log_text?.trim() || '특이사항 없음';
  const maskedText = maskPatientIdentifiers(rawText);
  const suspectedEdema = /부종|swelling|edema|sưng|sung/i.test(rawText);
  const painSignal = /통증|pain|đau|ache/i.test(rawText);

  return {
    source_language: payload.raw_log_lang ?? 'ko',
    meal_status: payload.meal_status ?? null,
    condition_status: payload.condition_status ?? null,
    medication_checked: payload.medication_checked ?? null,
    clinical_observation: {
      suspected_edema: suspectedEdema,
      pain_signal: painSignal,
      raw_note_excerpt_encrypted: encryptSensitiveData(maskedText.slice(0, 240)),
      raw_note_excerpt_encryption: 'aes-256-gcm:v1',
    },
    suggested_action:
      suspectedEdema || painSignal
        ? '다음 외래 또는 보호자 확인 시 통증/부종 부위를 재확인하십시오.'
        : '현재 특이 위험 신호는 낮으며 일반 관찰을 유지하십시오.',
  };
}

function scoreReadmissionRisk(payload: CareLogPayload, report: ReturnType<typeof buildMedicalReport>) {
  let score = 12;

  if (payload.meal_status === 'FAIR') score += 12;
  if (payload.meal_status === 'POOR') score += 30;
  if (payload.condition_status === 'NORMAL') score += 10;
  if (payload.condition_status === 'BAD') score += 28;
  if (payload.medication_checked === false) score += 20;
  if (report.clinical_observation.suspected_edema) score += 12;
  if (report.clinical_observation.pain_signal) score += 10;

  return Math.min(score, 100);
}

function buildSummary(payload: CareLogPayload, riskScore: number) {
  const mealLabel = payload.meal_status === 'GOOD' ? '양호' : payload.meal_status === 'FAIR' ? '보통' : '저조';
  const conditionLabel =
    payload.condition_status === 'GOOD' ? '양호' : payload.condition_status === 'NORMAL' ? '보통' : '주의 필요';
  const medicationLabel = payload.medication_checked ? '복약 완료' : '복약 미확인 또는 미복약';

  return `오늘 케어 기록을 AI 에이전트가 정리했습니다. 식사 상태는 ${mealLabel}, 전반 컨디션은 ${conditionLabel}, 복약 상태는 ${medicationLabel}로 기록되었습니다. 현재 재입원 위험도 추정치는 ${riskScore.toFixed(
    1,
  )}%이며, 보호자와 병원 관제팀은 필요 시 추가 확인을 진행할 수 있습니다.`;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as CareLogPayload;

    if (!payload.match_id && !payload.booking_request_id) {
      return NextResponse.json(
        { success: false, error: 'match_id or booking_request_id is required.' },
        { status: 400 },
      );
    }

    const report = buildMedicalReport(payload);
    const riskScore = scoreReadmissionRisk(payload, report);
    const anomalyDetected = riskScore >= 60;
    const anomalyType = anomalyDetected ? 'READMISSION_RISK' : null;

    const { supabaseUrl, serviceRoleKey } = getServerSupabaseConfig();
    const headers: Record<string, string> = {
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    if (serviceRoleKey.startsWith('eyJ')) {
      headers.Authorization = `Bearer ${serviceRoleKey}`;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agent_insights`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        match_id: payload.match_id ?? null,
        booking_request_id: payload.booking_request_id ?? null,
        ai_refined_summary_ko: buildSummary(payload, riskScore),
        ai_medical_report_json: report,
        dispatcher_recommendation_json: {
          action: anomalyDetected ? 'ADMIN_REVIEW_AND_GUARDIAN_ALERT' : 'AUTO_CLOSE_MONITORING',
          reason: anomalyDetected
            ? '정형 상태값과 자유 일지에서 위험 신호가 동시에 감지되었습니다.'
            : '현재 자동 관제 범위 안에서 처리 가능합니다.',
        },
        readmission_risk_score: riskScore,
        anomaly_detected: anomalyDetected,
        anomaly_type: anomalyType,
        severity: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'WARNING' : 'INFO',
        model_version: 'rules-v1',
      }),
    });

    const resultText = await response.text();
    if (!response.ok) {
      throw new Error(resultText || 'Failed to save AI agent insight.');
    }

    const data = JSON.parse(resultText)[0];

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI agent error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
