export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-brand-100/70 bg-white/70 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent dark:via-brand-700/40" />
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-brand-gradient text-white text-sm font-bold">ن</span>
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Nasym-ur-Rahmah</span>
              <span className="text-slate-500 dark:text-slate-400"> — built to help youth learn Islam with kindness and clarity.</span>
            </p>
          </div>
          <p className="text-xs italic text-slate-500 dark:text-slate-400">
            &ldquo;And remind, for indeed, the reminder benefits the believers.&rdquo; (Qur&apos;an 51:55)
          </p>
        </div>
      </div>
    </footer>
  );
}
