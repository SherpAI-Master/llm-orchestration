import type { ReactNode } from "react";

type LoadingStateProps = {
  title: string;
  message?: string;
  children?: ReactNode;
  variant?: "page" | "overlay" | "inline";
};

export default function LoadingState({
  title,
  message,
  children,
  variant = "page",
}: LoadingStateProps) {
  const rootClassName =
    variant === "overlay"
      ? "absolute inset-0 z-20 flex items-center justify-center bg-white/72 px-6 py-8 backdrop-blur-sm"
      : variant === "inline"
        ? "flex items-center justify-center px-4 py-6"
        : "flex min-h-[58vh] items-center justify-center px-4 py-6";

  const panelClassName =
    variant === "overlay"
      ? "w-full max-w-md rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
      : "w-full max-w-xl rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_26px_80px_rgba(15,23,42,0.08)]";

  return (
    <div className={rootClassName} role="status" aria-live="polite" aria-busy="true">
      <div className={panelClassName}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 self-center sm:self-start">
            <div className="absolute inset-0 rounded-full border-[3px] border-[var(--brand)]/14" />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[var(--brand)] border-r-orange-300" />
            <div className="absolute inset-[10px] animate-spin rounded-full border-2 border-transparent border-b-slate-400 border-l-slate-300 [animation-direction:reverse] [animation-duration:1.4s]" />
            <div
              className="absolute inset-[23px] rounded-full bg-[var(--brand)]"
              style={{ boxShadow: "0 0 28px rgba(234, 88, 12, 0.35)" }}
            />
          </div>

          <div className="min-w-0 space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
              SherpAI
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              {message ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
              ) : null}
            </div>
          </div>
        </div>

        {children ? <div className="mt-5 border-t border-slate-100 pt-4">{children}</div> : null}
      </div>
    </div>
  );
}
