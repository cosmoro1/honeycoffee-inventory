export function CategoryTabs({ categories, selectedCategory, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Product categories">
      {categories.map((category) => {
        const isActive = selectedCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-[#0b5b38] text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950"
                : "border border-white/80 bg-white/65 text-[#0b5b38] backdrop-blur-xl hover:border-[#0b5b38]/25 dark:border-emerald-300/10 dark:bg-[#172b20] dark:text-white dark:hover:border-emerald-300/45"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
