export type MatchStatus = 'PENDING' | 'MATCHED' | 'ONGOING' | 'COMPLETED' | 'CANCELED' | 'TIMEOUT';
export type CareType = 'BRIDGE' | 'TOURISM' | 'EMERGENCY';
export type Religion = 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'NONE';
export type CareTag = 'MEDICATION' | 'WHEELCHAIR' | 'TRANSLATION' | 'PICKUP' | 'PHARMACY';

export const CURE_LINK_MAPPING = {
  STATUS: {
    PENDING: {
      label: '수락 대기',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    MATCHED: {
      label: '매칭 완료',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    ONGOING: {
      label: '진행 중',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    COMPLETED: {
      label: '케어 완료',
      color: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    CANCELED: {
      label: '취소됨',
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    TIMEOUT: {
      label: '응답 만료',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  } satisfies Record<MatchStatus, { label: string; color: string }>,

  CARE_TYPE: {
    BRIDGE: '퇴원 브릿지 케어',
    TOURISM: '의료 관광 컨시어지',
    EMERGENCY: '긴급 SOS 돌봄',
  } satisfies Record<CareType, string>,

  RELIGION: {
    CHRISTIAN: '기독교',
    BUDDHIST: '불교',
    CATHOLIC: '가톨릭',
    NONE: '무교',
  } satisfies Record<Religion, string>,

  TAGS: {
    MEDICATION: '복약지도',
    WHEELCHAIR: '휠체어 동행',
    TRANSLATION: '영어 통역',
    PICKUP: '호텔 픽업',
    PHARMACY: '약국 동행',
  } satisfies Record<CareTag, string>,
};
