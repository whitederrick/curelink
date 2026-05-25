type PayoutRequest = {
  matchId: string;
  totalAmount?: number;
  totalAmountUsd?: number;
  currency_code?: string;
  currencyCode?: string;
  crewStripeAccountId: string;
  partnerStripeAccountId?: string;
  crewShareRate: number;
  partnerShareRate?: number;
};

type StripeTransferResult = {
  id: string;
  amount: number;
  currency: string;
  destination: string;
};

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for global payouts.');
  }

  return secretKey;
}

function toStripeMinorUnits(amount: number, currencyCode: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payout amount must be a positive number.');
  }

  const normalizedCurrency = currencyCode.toUpperCase();

  return ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)
    ? Math.round(amount)
    : Math.round(amount * 100);
}

async function createStripeTransfer(params: {
  amount: number;
  currency: string;
  destination: string;
  transferGroup: string;
  description: string;
}) {
  const body = new URLSearchParams({
    amount: String(params.amount),
    currency: params.currency.toLowerCase(),
    destination: params.destination,
    transfer_group: params.transferGroup,
    description: params.description,
  });

  const response = await fetch(`${STRIPE_API_BASE}/transfers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const result = (await response.json()) as StripeTransferResult & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Stripe transfer failed.');
  }

  return result;
}

export async function executeGlobalPayout(params: PayoutRequest) {
  const {
    matchId,
    totalAmount,
    totalAmountUsd,
    currency_code,
    currencyCode,
    crewStripeAccountId,
    partnerStripeAccountId,
    crewShareRate,
    partnerShareRate = 0,
  } = params;
  const settlementCurrency = (currency_code ?? currencyCode ?? 'USD').toUpperCase();
  const payoutAmount = totalAmount ?? totalAmountUsd;

  if (payoutAmount === undefined) {
    throw new Error('totalAmount is required for global payouts.');
  }

  if (crewShareRate <= 0 || crewShareRate > 1) {
    throw new Error('crewShareRate must be between 0 and 1.');
  }

  if (partnerShareRate < 0 || partnerShareRate > 1) {
    throw new Error('partnerShareRate must be between 0 and 1.');
  }

  if (crewShareRate + partnerShareRate > 1) {
    throw new Error('Combined payout share cannot exceed 100%.');
  }

  const crewTransfer = await createStripeTransfer({
    amount: toStripeMinorUnits(payoutAmount * crewShareRate, settlementCurrency),
    currency: settlementCurrency,
    destination: crewStripeAccountId,
    transferGroup: matchId,
    description: `CureLink crew payout - ${matchId}`,
  });

  const partnerTransfer =
    partnerStripeAccountId && partnerShareRate > 0
      ? await createStripeTransfer({
          amount: toStripeMinorUnits(payoutAmount * partnerShareRate, settlementCurrency),
          currency: settlementCurrency,
          destination: partnerStripeAccountId,
          transferGroup: matchId,
          description: `CureLink partner commission - ${matchId}`,
        })
      : null;

  return {
    success: true,
    match_id: matchId,
    crew_transfer_id: crewTransfer.id,
    partner_transfer_id: partnerTransfer?.id ?? null,
    crew_amount_minor_units: crewTransfer.amount,
    partner_amount_minor_units: partnerTransfer?.amount ?? 0,
    crew_amount_cents: settlementCurrency === 'USD' ? crewTransfer.amount : null,
    partner_amount_cents: settlementCurrency === 'USD' ? partnerTransfer?.amount ?? 0 : null,
    currency: settlementCurrency.toLowerCase(),
    processed_at: new Date().toISOString(),
  };
}
