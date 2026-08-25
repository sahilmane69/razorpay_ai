import type {
  BatchSummary,
  ExceptionItem,
  ReconciliationResult,
  ReconciliationRun,
} from "./types";

export const MERCHANT_NAME = "Kala Home";

export const BATCH_SUMMARY: BatchSummary = {
  totalRecords: 50,
  resolved: 47,
  unresolved: 3,
  matchRate: 94,
  accuracy: 98,
  processingTimeSeconds: 1.8,
  exactMatches: 38,
  ruleBased: 6,
  aiAssisted: 3,
};

export const RESULTS: ReconciliationResult[] = [
  {
    orderId: "ORD-1038",
    ledger: {
      orderId: "ORD-1038",
      customer: "Meera Joshi",
      amountExpected: 1200,
      date: "2026-08-21",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nq8xK2mL9aB1cD",
        orderId: "ORD-1038",
        settlementId: "setl_P2a91kLm",
        amountGross: 1200,
        fee: 0,
        amountSettled: 1200,
        utr: "HDFC026183947",
        date: "2026-08-22",
      },
    ],
    method: "exact",
    confidence: 100,
    status: "matched",
    reason:
      "Ledger expected ₹1,200. Razorpay settled the same amount against this order.",
  },
  {
    orderId: "ORD-1041",
    ledger: {
      orderId: "ORD-1041",
      customer: "Arjun Nair",
      amountExpected: 1000,
      date: "2026-08-21",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nq91dF4eR7sT8u",
        orderId: "ORD-1041",
        settlementId: "setl_P2a91kLm",
        amountGross: 1000,
        fee: 20,
        amountSettled: 980,
        utr: "HDFC026183947",
        date: "2026-08-22",
      },
    ],
    method: "fee_adjusted",
    confidence: 100,
    status: "matched",
    reason:
      "Ledger expected ₹1,000. Razorpay recorded ₹1,000 gross and ₹980 after ₹20 processing fee.",
  },
  {
    orderId: "ORD-1052",
    ledger: {
      orderId: "ORD-1052",
      customer: "Sana Kapoor",
      amountExpected: 2400,
      date: "2026-08-20",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nr02hG5iU1vW2x",
        orderId: "ORD-1052",
        settlementId: "setl_P1z80jKl",
        amountGross: 1400,
        fee: 28,
        amountSettled: 1372,
        date: "2026-08-21",
      },
      {
        paymentId: "pay_Nr03jH6kV2wX3y",
        orderId: "ORD-1052",
        settlementId: "setl_P2a91kLm",
        amountGross: 1000,
        fee: 20,
        amountSettled: 980,
        date: "2026-08-22",
      },
    ],
    method: "ai_assisted",
    confidence: 86,
    status: "matched",
    reason:
      "Two Razorpay settlement entries together equal the ledger order amount and occur within the expected settlement window.",
  },
  {
    orderId: "ORD-1045",
    ledger: {
      orderId: "ORD-1045",
      customer: "Rahul Deshmukh",
      amountExpected: 800,
      date: "2026-08-22",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Ns14kI7lW3xY4z",
        orderId: "ORD-1045",
        settlementId: "setl_P3b02lMn",
        amountGross: 800,
        fee: 0,
        amountSettled: 800,
        utr: "ICIC000441829",
        date: "2026-08-23",
      },
    ],
    method: "exact",
    confidence: 100,
    status: "matched",
    reason:
      "Ledger expected ₹800. Razorpay settled the same amount against this order.",
  },
  {
    orderId: "ORD-1058",
    ledger: {
      orderId: "ORD-1058",
      customer: "Priya Iyer",
      amountExpected: 3600,
      date: "2026-08-19",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nt25lJ8mX4yZ5a",
        orderId: "ORD-1058",
        settlementId: "setl_P1z80jKl",
        amountGross: 1800,
        fee: 36,
        amountSettled: 1764,
        date: "2026-08-21",
      },
      {
        paymentId: "pay_Nt26mK9nY5zA6b",
        orderId: "ORD-1058",
        settlementId: "setl_P2a91kLm",
        amountGross: 1800,
        fee: 36,
        amountSettled: 1764,
        date: "2026-08-22",
      },
    ],
    method: "split",
    confidence: 100,
    status: "matched",
    reason:
      "The customer paid in two Razorpay payments of ₹1,800. Together they match the ledger order of ₹3,600.",
  },
  {
    orderId: "ORD-1074",
    ledger: {
      orderId: "ORD-1074",
      customer: "Kabir Shah",
      amountExpected: 1750,
      date: "2026-08-22",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nu37nL0oZ6aB7c",
        orderId: "ORD-1074",
        settlementId: "setl_P3b02lMn",
        amountGross: 1750,
        fee: 35,
        amountSettled: 1715,
        utr: "ICIC000441829",
        date: "2026-08-23",
      },
    ],
    method: "fee_adjusted",
    confidence: 100,
    status: "matched",
    reason:
      "Ledger expected ₹1,750. Razorpay recorded ₹1,750 gross and ₹1,715 after ₹35 processing fee.",
  },
  {
    orderId: "ORD-1080",
    ledger: {
      orderId: "ORD-1080",
      customer: "Ananya Rao",
      amountExpected: 900,
      date: "2026-08-23",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nv48oM1pA7bC8d",
        orderId: "ORD-1080",
        settlementId: "setl_P3b02lMn",
        amountGross: 900,
        fee: 0,
        amountSettled: 900,
        date: "2026-08-23",
      },
    ],
    method: "exact",
    confidence: 100,
    status: "matched",
    reason:
      "Ledger expected ₹900. Razorpay settled the same amount against this order.",
  },
  {
    orderId: "ORD-1088",
    ledger: {
      orderId: "ORD-1088",
      customer: "Vikram Sethi",
      amountExpected: 4500,
      date: "2026-08-20",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nw59pN2qB8cD9e",
        settlementId: "setl_P2a91kLm",
        amountGross: 4500,
        fee: 90,
        amountSettled: 4410,
        date: "2026-08-22",
      },
    ],
    method: "ai_assisted",
    confidence: 86,
    status: "matched",
    reason:
      "The settlement amount and timing match this ledger order, even though the Razorpay payment did not include an order ID.",
  },
  {
    orderId: "ORD-1042",
    ledger: {
      orderId: "ORD-1042",
      customer: "Neha Bansal",
      amountExpected: 1500,
      date: "2026-08-21",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Nx60qO3rC9dE0f",
        orderId: "ORD-1042",
        settlementId: "setl_P2a91kLm",
        amountGross: 1480,
        fee: 30,
        amountSettled: 1450,
        date: "2026-08-22",
      },
    ],
    method: "unresolved",
    status: "review",
    reason:
      "Razorpay settled ₹20 less than the expected ledger amount, and the difference is not explained by the usual processing fee.",
  },
  {
    orderId: "ORD-1061",
    ledger: {
      orderId: "ORD-1061",
      customer: "Farhan Qureshi",
      amountExpected: 2200,
      date: "2026-08-18",
    },
    razorpayRecords: [],
    method: "unresolved",
    status: "review",
    reason:
      "This order is in the ledger, but no matching Razorpay payment or settlement was found.",
  },
  {
    orderId: "ORD-1070",
    ledger: {
      orderId: "ORD-1070",
      customer: "Ishita Menon",
      amountExpected: 500,
      date: "2026-08-22",
    },
    razorpayRecords: [
      {
        paymentId: "pay_Ny71rP4sD0eF1g",
        orderId: "ORD-1070",
        settlementId: "setl_P3b02lMn",
        amountGross: 500,
        fee: 10,
        amountSettled: 490,
        date: "2026-08-23",
      },
      {
        paymentId: "pay_Ny72sQ5tE1fG2h",
        orderId: "ORD-1070",
        settlementId: "setl_P3b02lMn",
        amountGross: 500,
        fee: 10,
        amountSettled: 490,
        date: "2026-08-23",
      },
    ],
    method: "unresolved",
    status: "review",
    reason:
      "Two Razorpay payments were captured for the same order amount on the same day. This needs a manual check before it can be closed.",
  },
];

export const EXCEPTIONS: ExceptionItem[] = [
  {
    orderId: "ORD-1042",
    type: "amount_mismatch",
    explanation:
      "Razorpay settled ₹20 less than the expected ledger amount.",
    ledgerAmount: 1500,
    closestCandidate: {
      paymentId: "pay_Nx60qO3rC9dE0f",
      orderId: "ORD-1042",
      settlementId: "setl_P2a91kLm",
      amountGross: 1480,
      fee: 30,
      amountSettled: 1450,
      date: "2026-08-22",
    },
  },
  {
    orderId: "ORD-1061",
    type: "missing_settlement",
    explanation:
      "No Razorpay payment or settlement was found for this ledger order.",
    ledgerAmount: 2200,
  },
  {
    orderId: "ORD-1070",
    type: "duplicate_payment",
    explanation:
      "Two Razorpay payments of ₹500 were captured for the same order.",
    ledgerAmount: 500,
    closestCandidate: {
      paymentId: "pay_Ny71rP4sD0eF1g",
      orderId: "ORD-1070",
      settlementId: "setl_P3b02lMn",
      amountGross: 500,
      fee: 10,
      amountSettled: 490,
      date: "2026-08-23",
    },
  },
];

export const HISTORY_RUNS: ReconciliationRun[] = [
  {
    id: "run_aug_25",
    date: "2026-08-25",
    ledgerFile: "august-ledger.csv",
    records: 50,
    matchRate: 94,
    exceptions: 3,
    status: "completed",
  },
  {
    id: "run_aug_18",
    date: "2026-08-18",
    ledgerFile: "week-33-ledger.csv",
    records: 42,
    matchRate: 100,
    exceptions: 0,
    status: "completed",
  },
  {
    id: "run_aug_11",
    date: "2026-08-11",
    ledgerFile: "week-32-ledger.csv",
    records: 38,
    matchRate: 89,
    exceptions: 4,
    status: "completed",
  },
];

export const RAZORPAY_CONNECTION = {
  accountName: "Razorpay Test Account",
  mode: "test" as const,
  paymentsAvailable: 128,
  settlementsAvailable: 6,
};
