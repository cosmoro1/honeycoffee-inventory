const toneClasses = {
  green: "from-white/85 to-[#dceee3]/80 text-[#082d1d]",
  coral: "from-white/85 to-[#f7d7cc]/80 text-[#082d1d]",
  gold: "from-white/85 to-[#f4dfb6]/80 text-[#082d1d]"
};

export function FeaturedPanel({ title, subtitle, status, tone, image }) {
  return (
    <article className={`relative min-h-32 overflow-hidden rounded-[1.5rem] border border-white/80 bg-gradient-to-br p-4 shadow-sm backdrop-blur-xl dark:border-emerald-300/10 dark:from-[#172b20] dark:to-[#0d1a13] dark:text-white ${toneClasses[tone] || toneClasses.green}`}>
      <div className="relative z-10">
        <span className="inline-flex rounded-full border border-[#0b5b38]/15 bg-white/55 px-3 py-1 text-xs font-bold text-[#0b5b38] dark:border-emerald-300/15 dark:bg-emerald-300/10 dark:text-emerald-200">
          {status}
        </span>
        <h2 className="mt-8 text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-1 max-w-40 text-sm font-medium opacity-85">{subtitle}</p>
      </div>
      <img
        src={image}
        alt=""
        className="absolute -right-8 bottom-0 h-28 w-40 rotate-[-8deg] rounded-tl-[3rem] object-cover opacity-75 mix-blend-multiply dark:opacity-35 dark:mix-blend-normal"
      />
    </article>
  );
}
