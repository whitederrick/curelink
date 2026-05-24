import { callCureLinkFunction } from '@/lib/edgeFunctions';

export type EmergencyPayload = {
  matchLogId?: string;
  bookingRequestId?: string;
  crewName: string;
  patientName: string;
  currentLatitude: number;
  currentLongitude: number;
  emergencyMemo: string;
};

export type EmergencyResult = {
  emergency_event_id: string;
  created_at: string;
  hospital_delivery?: unknown;
  guardian_delivery?: unknown;
};

export async function triggerCureLinkSOS(data: EmergencyPayload) {
  return callCureLinkFunction<EmergencyResult>('emergency-sos', {
    match_log_id: data.matchLogId,
    booking_request_id: data.bookingRequestId,
    crew_name: data.crewName,
    patient_name: data.patientName,
    current_latitude: data.currentLatitude,
    current_longitude: data.currentLongitude,
    emergency_memo: data.emergencyMemo,
  });
}
