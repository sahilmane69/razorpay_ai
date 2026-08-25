import "server-only";

import Razorpay from "razorpay";

function configured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function isRazorpayConfigured() {
  return configured();
}

export function getRazorpayClient() {
  if (!configured()) {
    throw new Error("Razorpay is not connected.");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

type Paged<T> = { items: T[] };

async function paginate<T>(
  fetchPage: (skip: number, count: number) => Promise<Paged<T>>
): Promise<T[]> {
  const items: T[] = [];
  const count = 100;
  let skip = 0;

  while (skip < 2000) {
    const page = await fetchPage(skip, count);
    items.push(...(page.items ?? []));
    if (!page.items || page.items.length < count) break;
    skip += count;
  }

  return items;
}

export async function fetchPayments() {
  const client = getRazorpayClient();
  return paginate((skip, count) => client.payments.all({ skip, count }) as Promise<Paged<Record<string, unknown>>>);
}

export async function fetchSettlements() {
  const client = getRazorpayClient();
  return paginate((skip, count) => client.settlements.all({ skip, count }) as Promise<Paged<Record<string, unknown>>>);
}

export async function fetchSettlementDetails(settlementId: string) {
  const client = getRazorpayClient();
  return client.settlements.fetch(settlementId) as Promise<Record<string, unknown>>;
}
