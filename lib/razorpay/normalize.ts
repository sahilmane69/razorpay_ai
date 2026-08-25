export type NormalizedRazorpayInsert = {
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  settlement_id: string | null;
  gross_amount_paise: number;
  fee_paise: number;
  tax_paise: number;
  net_amount_paise: number;
  utr: string | null;
  transaction_date: string;
  raw_data: Record<string, unknown>;
};

function unixToIso(value: unknown) {
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === "string" && value) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && asNumber > 1000000000) {
      return new Date(asNumber * 1000).toISOString();
    }
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizePayment(payment: Record<string, unknown>): NormalizedRazorpayInsert | null {
  const status = asString(payment.status);
  if (status && !["captured", "authorized"].includes(status)) {
    return null;
  }

  const gross = asNumber(payment.amount);
  if (gross <= 0) return null;
  const fee = asNumber(payment.fee);
  const tax = asNumber(payment.tax);

  return {
    razorpay_payment_id: asString(payment.id),
    razorpay_order_id: asString(payment.order_id) ?? asString((payment.notes as Record<string, unknown> | undefined)?.order_id),
    settlement_id: null,
    gross_amount_paise: gross,
    fee_paise: fee,
    tax_paise: tax,
    net_amount_paise: gross - fee - tax,
    utr: asString(payment.acquirer_data ? (payment.acquirer_data as Record<string, unknown>).rrn : null),
    transaction_date: unixToIso(payment.created_at),
    raw_data: payment,
  };
}

export function normalizeSettlement(settlement: Record<string, unknown>): NormalizedRazorpayInsert | null {
  const gross = asNumber(settlement.amount);
  if (gross <= 0) return null;
  const fee = asNumber(settlement.fees ?? settlement.fee);
  const tax = asNumber(settlement.tax);

  return {
    razorpay_payment_id: null,
    razorpay_order_id: null,
    settlement_id: asString(settlement.id),
    gross_amount_paise: gross,
    fee_paise: fee,
    tax_paise: tax,
    net_amount_paise: gross - fee - tax,
    utr: asString(settlement.utr),
    transaction_date: unixToIso(settlement.created_at),
    raw_data: settlement,
  };
}

export function attachSettlementId(
  payment: NormalizedRazorpayInsert,
  settlementId: string
): NormalizedRazorpayInsert {
  return { ...payment, settlement_id: settlementId };
}
