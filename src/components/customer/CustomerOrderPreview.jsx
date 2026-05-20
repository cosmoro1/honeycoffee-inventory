import { BadgeCheck, IdCard, Minus, Plus, ReceiptText, Sparkles, Trash2 } from "lucide-react";

function parsePrice(price) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export function CustomerOrderPreview({
  pickupNumber,
  items,
  fallbackProducts,
  message,
  tapatResult,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
  onOpenTapat
}) {
  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const tapatApproved = Boolean(tapatResult?.approved && tapatResult?.discount);
  const discountAmount = tapatApproved ? tapatResult.discount.discount_amount : 0;
  const netTotal = tapatApproved ? tapatResult.discount.net_total : subtotal;

  return (
    <aside className="rounded-[1.75rem] border border-white/75 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-emerald-300/10 dark:bg-[#102018] lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:self-start lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#0b5b38] dark:text-emerald-300">My Picks</p>
          <h2 className="mt-1 text-xl font-black text-[#082d1d] dark:text-white">Your selections</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0b5b38] text-white shadow-lg shadow-[#0b5b38]/20 dark:bg-emerald-400 dark:text-emerald-950">
          <ReceiptText size={20} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#0b5b38]/10 bg-[#fbf8ea]/80 p-4 dark:border-emerald-300/10 dark:bg-[#172b20]">
        <p className="text-xs font-black uppercase tracking-wide text-[#0b5b38] dark:text-emerald-300">Pickup No.</p>
        <p className="mt-1 break-all text-lg font-black text-[#082d1d] dark:text-white">{pickupNumber}</p>
        <p className="mt-1 text-xs font-semibold text-[#6b776c] dark:text-emerald-50/75">Use this number when picking up at the counter.</p>
      </div>

      {items.length ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#0b5b38]/10 bg-white/75 p-2.5 dark:border-emerald-300/10 dark:bg-[#172b20]">
              <div className="flex items-center gap-3">
                <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#082d1d] dark:text-white">{item.name}</p>
                  <p className="text-xs font-medium text-[#6b776c] dark:text-emerald-100/80">{item.price}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f5ed] text-[#6b776c] hover:text-red-600 dark:bg-black/20 dark:text-emerald-100/65 dark:hover:text-red-300"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center rounded-full border border-[#0b5b38]/15 bg-[#fbf8ea] p-1 dark:border-white/10 dark:bg-black/20">
                  <button
                    type="button"
                    onClick={() => onDecrease(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0b5b38] dark:bg-white/10 dark:text-emerald-200"
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={15} aria-hidden="true" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-black text-[#082d1d] dark:text-emerald-50">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onIncrease(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b5b38] text-white dark:bg-emerald-400 dark:text-emerald-950"
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={15} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-sm font-black text-[#082d1d] dark:text-emerald-50">
                  PHP {(parsePrice(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#0b5b38]/20 bg-[#fbf8ea]/70 p-4 dark:border-emerald-300/15 dark:bg-[#172b20]">
          <p className="flex items-center gap-2 text-sm font-black text-[#082d1d] dark:text-white">
            <Sparkles size={16} aria-hidden="true" />
            Add your favorites
          </p>
          <div className="mt-4 space-y-3">
            {fallbackProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <img src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#082d1d] dark:text-white">{product.name}</p>
                  <p className="text-xs font-medium text-[#6b776c] dark:text-emerald-100/80">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {onOpenTapat ? (
        <button
          type="button"
          onClick={onOpenTapat}
          disabled={!items.length}
          className={`mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            tapatApproved
              ? "border-[#0b5b38] bg-[#e8f6ee] text-[#0b5b38] hover:bg-[#d8efe1] dark:border-emerald-300/40 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-[#0b5b38]/20 bg-white/70 text-[#082d1d] hover:border-[#0b5b38]/60 hover:bg-[#fbf8ea] dark:border-emerald-300/15 dark:bg-[#172b20] dark:text-emerald-50 dark:hover:border-emerald-300/40"
          }`}
        >
          <span className="flex items-center gap-2.5">
            {tapatApproved ? (
              <BadgeCheck size={18} aria-hidden="true" />
            ) : (
              <IdCard size={18} aria-hidden="true" />
            )}
            <span className="flex flex-col">
              <span className="text-sm font-black">
                {tapatApproved ? "TAPAT discount applied" : "TAPAT Card · PWD / Senior"}
              </span>
              <span className="text-xs font-semibold opacity-80">
                {tapatApproved
                  ? `${tapatResult.beneficiary_type} · ···${tapatResult.card_id.slice(-4)}`
                  : "Tap or enter card to apply discount"}
              </span>
            </span>
          </span>
          <span className="text-sm font-black">
            {tapatApproved ? `−PHP ${discountAmount.toFixed(2)}` : "Add"}
          </span>
        </button>
      ) : null}

      <div className="mt-4 rounded-2xl bg-[#0b5b38] p-4 text-white shadow-lg shadow-[#0b5b38]/15 dark:bg-emerald-400 dark:text-emerald-950">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white/75 dark:text-emerald-950/70">Subtotal</p>
          <p className="text-2xl font-black">PHP {subtotal.toFixed(2)}</p>
        </div>
        {tapatApproved ? (
          <>
            <div className="mt-1 flex items-center justify-between text-sm font-semibold text-white/80 dark:text-emerald-950/80">
              <span>TAPAT discount</span>
              <span>−PHP {discountAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-white/30 pt-2 dark:border-emerald-950/30">
              <p className="text-sm font-semibold text-white/75 dark:text-emerald-950/70">Net total</p>
              <p className="text-2xl font-black">PHP {netTotal.toFixed(2)}</p>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-white/70 dark:text-emerald-950/70">Review your choices before ordering at the counter.</p>
        )}
        <button
          type="button"
          onClick={onCheckout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-[#0b5b38] dark:bg-emerald-950 dark:text-emerald-100"
        >
          Review Picks
        </button>
        {message ? <p className="mt-3 text-sm font-semibold text-white dark:text-emerald-950">{message}</p> : null}
      </div>
    </aside>
  );
}
