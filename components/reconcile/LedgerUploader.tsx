"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { LedgerUpload } from "@/lib/types";
import { FileCsv, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";

type LedgerUploaderProps = {
  upload: LedgerUpload | null;
  onUpload: (upload: LedgerUpload) => void;
};

export function LedgerUploader({ upload, onUpload }: LedgerUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendFile(file: File) {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/ledger/upload", { method: "POST", body: form });
    const payload = (await response.json()) as {
      error?: string;
      uploadId?: string;
      fileName?: string;
      accepted?: number;
      rejected?: number;
    };
    setBusy(false);
    if (!response.ok || !payload.uploadId) {
      setError(payload.error ?? "Could not upload this ledger.");
      return;
    }
    onUpload({
      id: payload.uploadId,
      fileName: payload.fileName ?? file.name,
      rowCount: payload.accepted ?? 0,
      rejectedCount: payload.rejected,
    });
  }

  async function useSample() {
    setBusy(true);
    setError("");
    await fetch("/api/evaluation/seed", { method: "POST" });
    const csv = await fetch("/sample-ledger.csv");
    if (!csv.ok) {
      setBusy(false);
      setError("Sample ledger is not available.");
      return;
    }
    const blob = await csv.blob();
    const file = new File([blob], "evaluation-ledger.csv", { type: "text/csv" });
    await sendFile(file);
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Step 1
      </p>
      <h2 className="mt-1 text-base font-semibold text-ink">Merchant ledger</h2>
      <p className="mt-1 text-sm text-muted">
        Upload the CSV export from your books.
      </p>

      <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-[12px] border border-dashed border-line bg-warm px-4 py-8 text-center">
        {upload ? (
          <>
            <FileCsv size={28} className="text-primary" />
            <p className="mt-3 text-sm font-medium text-ink">{upload.fileName}</p>
            <p className="mt-1 text-sm text-muted">{upload.rowCount} records</p>
            {upload.rejectedCount ? (
              <p className="mt-1 text-sm text-alert">{upload.rejectedCount} rows rejected</p>
            ) : null}
          </>
        ) : (
          <>
            <UploadSimple size={28} className="text-muted" />
            <p className="mt-3 text-sm text-muted">CSV files only</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void sendFile(file);
        }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          Choose CSV
        </Button>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => void useSample()}
          disabled={busy}
        >
          Use sample ledger
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
    </Card>
  );
}
