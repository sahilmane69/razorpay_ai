export function rupeesToPaise(value: string | number): number {
  const asString = typeof value === "number" ? value.toFixed(2) : value.trim();
  const match = asString.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    throw new Error("Invalid money value");
  }

  const negative = match[1] === "-";
  const rupees = match[2];
  const fraction = (match[3] ?? "").padEnd(2, "0");
  const paise = Number.parseInt(rupees, 10) * 100 + Number.parseInt(fraction, 10);
  return negative ? -paise : paise;
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
}
