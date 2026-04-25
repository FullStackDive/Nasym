import { clsx } from "clsx";

export function cn(...classes: Array<string | undefined | null | false>) {
  return clsx(classes);
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-950 focus:ring-brand-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]";
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };
  const styles: Record<string, string> = {
    primary:
      "text-white bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-soft hover:shadow-glow",
    secondary:
      "bg-brand-50 text-brand-900 hover:bg-brand-100 border border-brand-100 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/60 dark:border-brand-800/60",
    ghost:
      "bg-transparent text-brand-800 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800/60",
    danger:
      "text-white bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-soft",
    accent:
      "text-white bg-gradient-to-br from-accent-600 to-accent-700 hover:from-accent-500 hover:to-accent-600 shadow-soft"
  };
  return <button className={cn(base, sizes[size], styles[variant], className)} {...props} />;
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400",
        "focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        "dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/40",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400",
        "focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        "dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/40",
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft backdrop-blur-sm transition-shadow",
        "dark:border-slate-800/80 dark:bg-slate-900/70",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "brand",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "brand" | "accent" | "muted" }) {
  const styles: Record<string, string> = {
    brand:
      "bg-brand-100 text-brand-900 ring-1 ring-inset ring-brand-200/60 dark:bg-brand-900/50 dark:text-brand-100 dark:ring-brand-700/50",
    accent:
      "bg-accent-100 text-accent-900 ring-1 ring-inset ring-accent-200/60 dark:bg-accent-900/40 dark:text-accent-100 dark:ring-accent-700/50",
    muted:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
