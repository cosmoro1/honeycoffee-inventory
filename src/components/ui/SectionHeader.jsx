export function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-coffee dark:text-emerald-300">{eyebrow}</p> : null}
      <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-emerald-50">{title}</h3>
      {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-emerald-100/65">{description}</p> : null}
    </div>
  );
}
