type PayoutRequest = {
  matchId: string;
  totalAmountUsd: number;
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

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for global payouts.');
  }

  return secretKey;
}

function toUsdCents(amountUsd: number) {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error('Payout amount must be a positive number.');
  }

  return Math.round(amountUsd * 100);
}

async function createStripeTransfer(params: {
  amount: number;
  destination: string;
  transferGroup: string;
  description: string;
}) {
  const body = new URLSearchParams({
    amount: String(params.amount),
    currency: 'usd',
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
    totalAmountUsd,
    crewStripeAccountId,
    partnerStripeAccountId,
    crewShareRate,
    partnerShareRate = 0,
  } = params;

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
    amount: toUsdCents(totalAmountUsd * crewShareRate),
    destination: crewStripeAccountId,
    transferGroup: matchId,
    description: `CureLink crew payout - ${matchId}`,
  });

  const partnerTransfer =
    partnerStripeAccountId && partnerShareRate > 0
      ? await createStripeTransfer({
          amount: toUsdCents(totalAmountUsd * partnerShareRate),
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
    crew_amount_cents: crewTransfer.amount,
    partner_amount_cents: partnerTransfer?.amount ?? 0,
    currency: 'usd',
    processed_at: new Date().toISOString(),
  };
}
