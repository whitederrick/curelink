'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Compass,
  CreditCard,
  Globe2,
  HeartHandshake,
  Languages,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { CURE_LINK_MAPPING, type CareType, type DataRegion, type Religion } from '@/constants/mapping';
import { callCureLinkFunction } from '@/lib/edgeFunctions';

const LATEST_BOOKING_STORAGE_KEY = 'curelink.latestBooking';

const PRICE_POLICY = {
  BASE: {
    BRIDGE: 80000,
    TOURISM: 150000,
    EMERGENCY: 120000,
  },
  PREMIUM_SURCHARGE: {
    TRANSLATION: 30000,
    WHEELCHAIR: 10000,
    CHRISTIAN: 5000,
    BUDDHIST: 5000,
    CATHOLIC: 5000,
    NONE: 0,
  },
};

const CARE_OPTIONS: Array<{ id: CareType; desc: string }> = [
  {
    id: 'BRIDGE',
    desc: '퇴원 당일 병원에서 자택까지 동행하고 복약, 식사, 이동을 단기 집중 케어합니다.',
  },
  {
    id: 'TOURISM',
    desc: '외국인 환자의 병원 방문, 의료 통역, 호텔 이동과 생활 동행을 지원합니다.',
  },
  {
    id: 'EMERGENCY',
    desc: '갑작스러운 일정 공백이나 보호자 부재 시 필요한 긴급 돌봄을 연결합니다.',
  },
];

const LANGUAGES = [
  { value: 'ko', label: '한국어 (기본 비용)' },
  { value: 'en', label: 'English (영어 통역 크루)' },
  { value: 'vi', label: 'Tiếng Việt (베트남어 통역 크루)' },
  { value: 'zh', label: '中文 (중국어 통역 크루)' },
];

type BookingResponse = {
  id: string;
  care_type: CareType;
  patient_name: string;
  patient_note?: string;
  required_language: string;
  required_religion: Religion;
  requires_wheelchair: boolean;
  total_amount: number;
  status: string;
  data_region: DataRegion;
  currency_code: string;
  exchange_rate: number;
  location_district?: string;
  source_partner_code?: string | null;
  created_at?: string;
};

function formatKRW(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

function inferDataRegion(language: string): DataRegion {
  if (language === 'en') return 'US';
  if (language === 'vi' || language === 'zh') return 'SEA';
  return 'KR';
}

export default function ConsumerBookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [careType, setCareType] = useState<CareType>('BRIDGE');
  const [selectedLang, setSelectedLang] = useState('ko');
  const [selectedReligion, setSelectedReligion] = useState<Religion>('NONE');
  const [requiresWheelchair, setRequiresWheelchair] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdBooking, setCreatedBooking] = useState<BookingResponse | null>(null);

  const dataRegion = inferDataRegion(selectedLang);

  const totalAmount = useMemo(() => {
    let surcharge = 0;

    if (selectedLang !== 'ko') surcharge += PRICE_POLICY.PREMIUM_SURCHARGE.TRANSLATION;
    if (requiresWheelchair) surcharge += PRICE_POLICY.PREMIUM_SURCHARGE.WHEELCHAIR;
    surcharge += PRICE_POLICY.PREMIUM_SURCHARGE[selectedReligion];

    return PRICE_POLICY.BASE[careType] + surcharge;
  }, [careType, requiresWheelchair, selectedLang, selectedReligion]);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const booking = await callCureLinkFunction<BookingResponse>('create-booking', {
        care_type: careType,
        required_day: 1,
        required_time_slot: 'SLOT_MORNING',
        required_language: selectedLang,
        required_religion: selectedReligion,
        requires_wheelchair: requiresWheelchair,
        patient_name: patientName.trim(),
        patient_note: patientNote.trim(),
        total_amount: totalAmount,
        base_amount_krw: totalAmount,
        customer_country_code: selectedLang === 'ko' ? 'KR' : selectedLang === 'vi' ? 'VN' : 'US',
        data_region: dataRegion,
        currency_code: 'KRW',
        exchange_rate: 1,
        location_district: 'Gangnam-gu',
        identity_verification_required: selectedLang !== 'ko',
        legal_disclaimer_agreed: true,
      });

      window.sessionStorage.setItem(LATEST_BOOKING_STORAGE_KEY, JSON.stringify(booking));
      setCreatedBooking(booking);
      setCurrentStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약 요청 저장에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900 antialiased">
      <header className="rounded-b-[2rem] bg-slate-950 p-6 text-white shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-sky-400">CureLink 예약 매니저</span>
          <span className="text-xs font-bold text-slate-400">
            Step {currentStep === 4 ? 3 : currentStep} / 3
          </span>
        </div>
        {currentStep < 4 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        )}
      </header>

      <section className="mx-auto mt-6 max-w-md px-5">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h1 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <HeartHandshake className="h-5 w-5 text-sky-500" aria-hidden="true" />
              어떤 지원이 필요하신가요?
            </h1>

            <div className="space-y-3">
              {CARE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCareType(item.id)}
                  className={`w-full rounded-3xl border-2 p-5 text-left transition active:scale-[0.99] ${
                    careType === item.id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="block text-base font-black text-slate-900">
                    {CURE_LINK_MAPPING.CARE_TYPE[item.id]}
                  </span>
                  <span className="mt-1.5 block text-sm font-semibold leading-6 text-slate-500">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-base font-black text-white shadow-md transition active:scale-95"
            >
              다음 조건 선택하기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <h1 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <Compass className="h-5 w-5 text-sky-500" aria-hidden="true" />
              맞춤형 크루 매칭 조건
            </h1>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                환자 성함
              </span>
              <input
                type="text"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="실제 케어를 받으실 분의 이름"
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                소통 필요 언어
              </span>
              <select
                value={selectedLang}
                onChange={(event) => setSelectedLang(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
              <p className="flex items-center gap-1 text-xs font-black text-sky-700">
                <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                글로벌 확장 준비 리전
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {CURE_LINK_MAPPING.DATA_REGION[dataRegion]} / KRW 기준 견적
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                선호 종교 매칭
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(['NONE', 'CHRISTIAN', 'BUDDHIST', 'CATHOLIC'] as Religion[]).map((religion) => (
                  <button
                    key={religion}
                    type="button"
                    onClick={() => setSelectedReligion(religion)}
                    className={`min-h-12 rounded-2xl border text-xs font-black transition active:scale-95 ${
                      selectedReligion === religion
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {religion === 'NONE' ? '상관없음' : CURE_LINK_MAPPING.RELIGION[religion]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={requiresWheelchair}
                onChange={(event) => setRequiresWheelchair(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
              <span>
                <span className="block text-sm font-black text-slate-800">
                  휠체어 이동 보조가 필요합니다
                </span>
                <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-400">
                  낙상 방지 교육을 이수한 특화 크루를 우선 매칭합니다.
                </span>
              </span>
            </label>

            <textarea
              value={patientNote}
              onChange={(event) => setPatientNote(event.target.value)}
              placeholder="환자 상태, 병원명, 이동 장소 등 특이사항"
              rows={3}
              className="w-full resize-none rounded-3xl border border-slate-200 bg-white p-4 text-sm font-semibold outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex min-h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!patientName.trim()) {
                    setErrorMessage('환자 성함을 입력해 주세요.');
                    return;
                  }
                  setErrorMessage('');
                  setCurrentStep(3);
                }}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 text-base font-black text-white shadow-md transition active:scale-95"
              >
                금액 및 일정 확정
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h1 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <CreditCard className="h-5 w-5 text-sky-500" aria-hidden="true" />
              CureLink 최종 견적서
            </h1>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              {[
                ['신청 항목', CURE_LINK_MAPPING.CARE_TYPE[careType]],
                ['대상 환자', `${patientName} 님`],
                [
                  '언어 / 종교',
                  `${selectedLang === 'ko' ? '한국어' : `${selectedLang.toUpperCase()} 통역`} / ${
                    selectedReligion === 'NONE' ? '상관없음' : CURE_LINK_MAPPING.RELIGION[selectedReligion]
                  }`,
                ],
                ['데이터 리전', CURE_LINK_MAPPING.DATA_REGION[dataRegion]],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-bold text-slate-500">{label}</span>
                  <span className="text-right text-sm font-black text-slate-800">{value}</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-black text-slate-900">최종 결제 예정액</span>
                <span className="text-xl font-black tracking-tight text-sky-600">
                  {formatKRW(totalAmount)}
                  <span className="ml-1 text-xs font-bold text-slate-400">원</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold leading-5 text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              화면의 금액은 안내용입니다. 실제 저장 금액은 백엔드가 동일한 가격 정책으로 다시 계산해
              위조 요청을 차단합니다.
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex min-h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-sky-500 text-base font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? '예약 저장 중...' : '안전 예약 결제하기'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-8 w-8 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                예약 요청이 저장되었습니다
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                예약번호 {createdBooking?.id.slice(0, 8)} / 결제 대기 상태로 등록되었습니다.
              </p>
            </div>

            <div className="mx-auto max-w-xs space-y-2 rounded-3xl border border-slate-200 bg-white p-4 text-left text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>확정 금액</span>
                <span className="text-sky-600">{formatKRW(createdBooking?.total_amount ?? totalAmount)}원</span>
              </div>
              <div className="flex justify-between">
                <span>예약 상태</span>
                <span className="text-emerald-600">{createdBooking?.status ?? 'PAYMENT_PENDING'}</span>
              </div>
            </div>

            <Link
              href={createdBooking ? `/book/success?id=${createdBooking.id}` : '/book/success'}
              className="mx-auto flex min-h-12 max-w-xs items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition active:scale-95"
            >
              예약 관제 화면 보기
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
