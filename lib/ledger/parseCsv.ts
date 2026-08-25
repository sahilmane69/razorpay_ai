import { rupeesToPaise } from "@/lib/money";
import { z } from "zod";

export type ParsedLedgerRow = {
  orderId: string;
  customer: string | null;
  amountPaise: number;
  date: Date;
};

export type LedgerParseResult = {
  rows: ParsedLedgerRow[];
  rejected: { line: number; reason: string }[];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((item) => item.some((value) => value.trim().length > 0));
}

const RowSchema = z.object({
  order_id: z.string().trim().min(1),
  amount: z.string().trim().min(1),
  date: z.string().trim().min(1),
  customer: z.string().optional(),
});

function parseDate(value: string): Date | null {
  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return new Date(iso);
  const parts = value.split(/[/-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) return new Date(`${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}T00:00:00`);
    return new Date(`${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}T00:00:00`);
  }
  return null;
}

export function parseLedgerCsv(text: string): LedgerParseResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    throw new Error("This CSV is empty.");
  }

  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const required = ["order_id", "amount", "date"];
  for (const column of required) {
    if (!header.includes(column)) {
      throw new Error(`This CSV is missing the required "${column}" column.`);
    }
  }

  const rows: ParsedLedgerRow[] = [];
  const rejected: { line: number; reason: string }[] = [];

  for (let i = 1; i < table.length; i += 1) {
    const line = i + 1;
    const raw: Record<string, string> = {};
    header.forEach((key, index) => {
      raw[key] = table[i][index] ?? "";
    });

    const parsed = RowSchema.safeParse(raw);
    if (!parsed.success) {
      rejected.push({ line, reason: "This row is missing a required value." });
      continue;
    }

    let amountPaise: number;
    try {
      amountPaise = rupeesToPaise(parsed.data.amount);
    } catch {
      rejected.push({ line, reason: "The amount could not be read." });
      continue;
    }

    if (amountPaise <= 0) {
      rejected.push({ line, reason: "The amount must be greater than zero." });
      continue;
    }

    const date = parseDate(parsed.data.date);
    if (!date || Number.isNaN(date.getTime())) {
      rejected.push({ line, reason: "The date could not be read." });
      continue;
    }

    rows.push({
      orderId: parsed.data.order_id,
      customer: parsed.data.customer?.trim() || null,
      amountPaise,
      date,
    });
  }

  return { rows, rejected };
}
