import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Truth = {
  orderId: string;
  expectedPaymentIds: string[];
  expectedMethod: string;
  shouldMatch: boolean;
};

type RazorpaySeed = {
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

function pad(value: number) {
  return String(value).padStart(4, "0");
}

function iso(dayOffset: number) {
  const date = new Date("2026-08-20T10:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString();
}

function payment(
  id: string,
  orderId: string | null,
  gross: number,
  fee: number,
  tax: number,
  dayOffset: number
): RazorpaySeed {
  return {
    razorpay_payment_id: id,
    razorpay_order_id: orderId,
    settlement_id: `setl_${id.replace("pay_", "")}`,
    gross_amount_paise: gross,
    fee_paise: fee,
    tax_paise: tax,
    net_amount_paise: gross - fee - tax,
    utr: `UTR${id.slice(-6)}`,
    transaction_date: iso(dayOffset),
    raw_data: { source: "synthetic", id, orderId },
  };
}

const ledger: string[] = ["order_id,customer,amount,date"];
const razorpay: RazorpaySeed[] = [];
const truth: Truth[] = [];
let paySeq = 1;

function nextPay() {
  const id = `pay_eval_${String(paySeq).padStart(3, "0")}`;
  paySeq += 1;
  return id;
}

function addLedger(orderId: string, customer: string, rupees: number, dayOffset: number) {
  const date = iso(dayOffset).slice(0, 10);
  ledger.push(`${orderId},${customer},${rupees},${date}`);
}

for (let i = 1; i <= 40; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const amount = 800 + i * 50;
  const payId = nextPay();
  addLedger(orderId, `Customer ${i}`, amount, 0);
  razorpay.push(payment(payId, orderId, amount * 100, 0, 0, 0));
  truth.push({ orderId, expectedPaymentIds: [payId], expectedMethod: "exact", shouldMatch: true });
}

for (let i = 41; i <= 55; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const amount = 1000 + (i - 40) * 100;
  const fee = 1700;
  const tax = 300;
  const payId = nextPay();
  addLedger(orderId, `Customer ${i}`, amount, 1);
  razorpay.push(payment(payId, orderId, amount * 100, fee, tax, 1));
  truth.push({
    orderId,
    expectedPaymentIds: [payId],
    expectedMethod: "fee_adjusted",
    shouldMatch: true,
  });
}

for (let i = 56; i <= 65; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const amount = 2400;
  const a = nextPay();
  const b = nextPay();
  addLedger(orderId, `Customer ${i}`, amount, 0);
  razorpay.push(payment(a, orderId, 120000, 0, 0, 0));
  razorpay.push(payment(b, orderId, 120000, 0, 0, 1));
  truth.push({
    orderId,
    expectedPaymentIds: [a, b],
    expectedMethod: "split",
    shouldMatch: true,
  });
}

for (let i = 66; i <= 73; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  addLedger(orderId, `Customer ${i}`, 2200, 0);
  truth.push({
    orderId,
    expectedPaymentIds: [],
    expectedMethod: "unresolved",
    shouldMatch: false,
  });
}

for (let i = 74; i <= 79; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const a = nextPay();
  const b = nextPay();
  addLedger(orderId, `Customer ${i}`, 500, 0);
  razorpay.push(payment(a, orderId, 50000, 1000, 0, 0));
  razorpay.push(payment(b, orderId, 50000, 1000, 0, 0));
  truth.push({
    orderId,
    expectedPaymentIds: [],
    expectedMethod: "unresolved",
    shouldMatch: false,
  });
}

for (let i = 80; i <= 84; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const payId = nextPay();
  addLedger(orderId, `Customer ${i}`, 1500, 0);
  razorpay.push(payment(payId, orderId, 150000, 0, 0, 20));
  truth.push({
    orderId,
    expectedPaymentIds: [],
    expectedMethod: "unresolved",
    shouldMatch: false,
  });
}

for (let i = 85; i <= 88; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const payId = nextPay();
  addLedger(orderId, `Customer ${i}`, 1800, 0);
  razorpay.push(payment(payId, `OTHER-${pad(i)}`, 180000, 0, 0, 0));
  truth.push({
    orderId,
    expectedPaymentIds: [payId],
    expectedMethod: "ai_assisted",
    shouldMatch: true,
  });
}

for (let i = 89; i <= 92; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const payId = nextPay();
  addLedger(orderId, `Customer ${i}`, 1500, 0);
  razorpay.push(payment(payId, orderId, 148000, 0, 0, 0));
  truth.push({
    orderId,
    expectedPaymentIds: [],
    expectedMethod: "unresolved",
    shouldMatch: false,
  });
}

for (let i = 93; i <= 100; i += 1) {
  const orderId = `EVAL-${pad(i)}`;
  const a = nextPay();
  const b = nextPay();
  addLedger(orderId, `Customer ${i}`, 900, 0);
  razorpay.push(payment(a, null, 90000, 0, 0, 0));
  razorpay.push(payment(b, null, 90000, 0, 0, 1));
  truth.push({
    orderId,
    expectedPaymentIds: [],
    expectedMethod: "unresolved",
    shouldMatch: false,
  });
}

const root = process.cwd();
mkdirSync(join(root, "data/evaluation"), { recursive: true });
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "data/evaluation/ledger.csv"), `${ledger.join("\n")}\n`);
writeFileSync(join(root, "public/sample-ledger.csv"), `${ledger.join("\n")}\n`);
writeFileSync(join(root, "data/evaluation/razorpay.json"), JSON.stringify(razorpay, null, 2));
writeFileSync(
  join(root, "data/evaluation/ground-truth.json"),
  JSON.stringify({ records: truth }, null, 2)
);

console.log(`Wrote ${truth.length} ledger records and ${razorpay.length} Razorpay records.`);
