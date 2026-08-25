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
  return paginate(async (skip, count) => {
    const page = (await client.payments.all({ skip, count })) as unknown as Paged<
      Record<string, unknown>
    >;
    return page;
  });
}

export async function fetchSettlements() {
  const client = getRazorpayClient();
  return paginate(async (skip, count) => {
    const page = (await client.settlements.all({ skip, count })) as unknown as Paged<
      Record<string, unknown>
    >;
    return page;
  });
}

export async function fetchSettlementDetails(settlementId: string) {
  const client = getRazorpayClient();
  return (await client.settlements.fetch(settlementId)) as unknown as Record<
    string,
    unknown
  >;
}
