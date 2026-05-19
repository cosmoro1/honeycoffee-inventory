import { Plus } from "lucide-react";

const statusClass = {
  Available: "bg-emerald-50 text-emerald-700",
  Popular: "bg-amber-50 text-amber-700",
  "Low Stock": "bg-orange-50 text-orange-700"
};

export function ProductCard({ product, onAdd }) {
  return (
    <article className="group flex min-h-56 flex-col rounded-[1.35rem] border border-white/75 bg-white/70 p-3 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#0b5b38]/25 hover:bg-white/90 hover:shadow-lg dark:border-emerald-300/10 dark:bg-[#102018] dark:hover:border-emerald-300/45 dark:hover:bg-[#13261d]">
      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-[1rem] bg-[#f7f4e8]/80 dark:bg-black/35">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[product.status] || statusClass.Available}`}>
          {product.status}
        </span>
      </div>

      <div className="mt-3 flex flex-1 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#082d1d] dark:text-white">{product.name}</p>
          <p className="mt-1 text-xs font-semibold text-[#6b776c] dark:text-emerald-100/80">{product.category}</p>
          {product.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#7a857b] dark:text-emerald-50/75">{product.description}</p>
          ) : null}
          <p className="mt-2 text-sm font-bold text-[#0b5b38] dark:text-emerald-300">{product.price}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd?.(product)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0b5b38] bg-white text-[#0b5b38] transition hover:bg-[#0b5b38] hover:text-white dark:border-emerald-300/50 dark:bg-[#172b20] dark:text-white dark:hover:bg-emerald-400 dark:hover:text-emerald-950"
          aria-label={`Add ${product.name}`}
        >
          <Plus size={19} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
