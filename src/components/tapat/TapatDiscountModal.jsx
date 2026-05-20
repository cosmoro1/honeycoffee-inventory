"use client";

import { useState } from "react";
import { BadgeCheck, CircleAlert, Loader2, X } from "lucide-react";

const DEMO_CARDS = [
  { id: "CARD-A1B2C3D4E5F6", label: "Maria Reyes — PWD" },
  { id: "CARD-SC-0000000001", label: "Carding Mendoza — Senior Citizen" },
  { id: "CARD-REVOKED-00001", label: "Revoked card (demo)" },
];

export function TapatDiscountModal({ cart, currentResult, onApply, onClear, onClose }) {
  const [cardId, setCardId] = useState("");
  const [phase, setPhase] = useState(
    currentResult?.approved ? "approved" : "idle"
  );
  const [result, setResult] = useState(currentResult ?? null);
  const [error, setError] = useState(null);

  async function handleVerify() {
    const trimmed = cardId.trim();
    if (!trimmed) return;
    setPhase("verifying");
    setError(null);
    try {
      const res = await fetch("/api/tapat/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: trimmed, items: cart }),
      });
      const data = await res.json();
      setResult(data);
      setPhase(data.approved ? "approved" : "rejected");
    } catch {
      setError("Could not reach the TAPAT Hub. Is it running?");
      setPhase("idle");
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setCardId("");
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-[440px] max-w-full rounded-3xl border border-white/70 bg-white p-6 shadow-2xl dark:border-emerald-300/15 dark:bg-[#0f1e16]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0b5b38] dark:text-emerald-300">
              TAPAT Card
            </p>
            <h3 className="mt-1 text-xl font-black text-[#082d1d] dark:text-white">
              PWD / Senior Citizen Discount
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1ede1] text-[#6b776c] hover:bg-[#e3ddc8] dark:bg-black/30 dark:text-emerald-100/70 dark:hover:bg-black/50"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {phase === "idle" && (
          <div className="mt-5">
            <p className="text-sm text-[#5e6d61] dark:text-emerald-100/75">
              Enter the cardholder's TAPAT card ID. The discount is computed by
              the Government Registry and applied before payment.
            </p>

            {error ? (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-red-300/40 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-300">
                <CircleAlert size={14} aria-hidden="true" />
                {error}
              </div>
            ) : null}

            <input
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              placeholder="CARD-XXXXXXXXXXXX"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="mt-4 w-full rounded-2xl border border-[#0b5b38]/15 bg-[#fbf8ea] px-4 py-3 font-mono text-sm tracking-wider text-[#082d1d] outline-none focus:border-[#0b5b38] dark:border-emerald-300/15 dark:bg-[#172b20] dark:text-white"
              autoFocus
            />

            <p className="mt-5 text-xs font-black uppercase tracking-wide text-[#6b776c] dark:text-emerald-200/70">
              Quick demo cards
            </p>
            <div className="mt-2 space-y-1">
              {DEMO_CARDS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCardId(c.id)}
                  className="block w-full rounded-xl border border-[#0b5b38]/10 bg-[#fbf8ea] px-3 py-2 text-left text-xs font-semibold text-[#082d1d] hover:border-[#0b5b38]/40 dark:border-emerald-300/15 dark:bg-[#172b20] dark:text-emerald-50 dark:hover:border-emerald-300/40"
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#0b5b38]/15 px-4 py-3 text-sm font-black text-[#082d1d] hover:bg-[#fbf8ea] dark:border-emerald-300/20 dark:text-white dark:hover:bg-[#172b20]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={!cardId.trim()}
                className="flex-1 rounded-full bg-[#0b5b38] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#0b5b38]/20 hover:bg-[#0a4a2e] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                Verify card
              </button>
            </div>
          </div>
        )}

        {phase === "verifying" && (
          <div className="mt-8 flex flex-col items-center gap-3 py-6">
            <Loader2 size={28} className="animate-spin text-[#0b5b38] dark:text-emerald-300" aria-hidden="true" />
            <p className="text-sm font-black text-[#082d1d] dark:text-white">
              Verifying with Government Registry
            </p>
            <p className="text-xs font-semibold text-[#5e6d61] dark:text-emerald-100/70">
              EDI 270 → 271 · TAPAT Hub
            </p>
          </div>
        )}

        {phase === "approved" && result?.discount ? (
          <div className="mt-5">
            <div className="flex items-center gap-3 rounded-2xl bg-[#e8f6ee] p-3 dark:bg-emerald-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b5b38] text-white dark:bg-emerald-400 dark:text-emerald-950">
                <BadgeCheck size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-black text-[#082d1d] dark:text-white">
                  Card verified
                </p>
                <p className="text-xs font-semibold text-[#5e6d61] dark:text-emerald-100/75">
                  {result.beneficiary_type}
                  {result.disability_type ? ` · ${result.disability_type}` : ""}
                  {result.card_id ? ` · ···${result.card_id.slice(-4)}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 rounded-2xl border border-[#0b5b38]/15 bg-[#fbf8ea] p-4 text-sm font-semibold text-[#082d1d] dark:border-emerald-300/15 dark:bg-[#172b20] dark:text-emerald-50">
              <Row label="Gross amount" value={`PHP ${result.discount.gross_amount.toFixed(2)}`} />
              {result.discount.vat_removed > 0 ? (
                <Row
                  label="Less: VAT removed"
                  value={`−PHP ${result.discount.vat_removed.toFixed(2)}`}
                  tone="warn"
                />
              ) : null}
              <Row
                label={`Less: ${result.discount.discount_type === "BNPC_5PCT" ? "5%" : "20%"} discount`}
                value={`−PHP ${result.discount.discount_amount.toFixed(2)}`}
                tone="good"
              />
              <div className="flex items-center justify-between border-t border-dashed border-[#0b5b38]/20 pt-2 text-base font-black dark:border-emerald-300/20">
                <span>Net total</span>
                <span>PHP {result.discount.net_total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-full border border-[#0b5b38]/15 px-4 py-3 text-sm font-black text-[#082d1d] hover:bg-[#fbf8ea] dark:border-emerald-300/20 dark:text-white dark:hover:bg-[#172b20]"
              >
                Re-scan
              </button>
              <button
                type="button"
                onClick={() => onApply(result)}
                className="flex-1 rounded-full bg-[#0b5b38] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#0b5b38]/20 hover:bg-[#0a4a2e] dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                Apply discount
              </button>
            </div>

            {currentResult?.approved ? (
              <button
                type="button"
                onClick={onClear}
                className="mt-3 w-full rounded-full border border-red-400/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                Remove applied discount
              </button>
            ) : null}
          </div>
        ) : null}

        {phase === "rejected" && result ? (
          <div className="mt-5">
            <div className="flex items-center gap-3 rounded-2xl border border-red-300/40 bg-red-50 p-3 dark:border-red-400/30 dark:bg-red-950/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                <CircleAlert size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-black text-red-700 dark:text-red-300">
                  Card rejected
                </p>
                <p className="text-xs font-semibold text-red-600/80 dark:text-red-300/80">
                  {result.message ?? result.error ?? "Verification failed"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#5e6d61] dark:text-emerald-100/70">
              Status: {result.validation_status ?? "UNAVAILABLE"}
              {result.card_id ? ` · ···${result.card_id.slice(-8)}` : ""}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 w-full rounded-full bg-[#0b5b38] px-4 py-3 text-sm font-black text-white hover:bg-[#0a4a2e] dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, tone }) {
  const toneClass =
    tone === "good"
      ? "text-[#0b5b38] dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : "text-[#082d1d] dark:text-emerald-50";
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#5e6d61] dark:text-emerald-100/70">
        {label}
      </span>
      <span className={`text-sm font-black ${toneClass}`}>{value}</span>
    </div>
  );
}
