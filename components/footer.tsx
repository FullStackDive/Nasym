import { LogoMark } from "@/components/ui";

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-brand-100/80 bg-white/88 backdrop-blur">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={30} />
            <p>
              <span className="font-semibold text-slate-800">Nasym-Ur-Rahmah Institute</span>
              <span className="text-slate-500"> — built to help youth learn Islam with kindness and clarity.</span>
            </p>
          </div>
          <p className="text-xs italic text-slate-500">
            &ldquo;And remind, for indeed, the reminder benefits the believers.&rdquo; (Qur&apos;an 51:55)
          </p>
        </div>
      </div>
    </footer>
  );
}
