import type { ReactNode, SVGProps } from "react";
import { cx } from "./store";
import type { Toast } from "./types";

/* ---------------- ícones (SVG próprios, stroke 1.7) ---------------- */

type IP = SVGProps<SVGSVGElement> & { size?: number };
const I = ({ size = 18, children, ...rest }: IP & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...rest}
  >
    {children}
  </svg>
);

export const IconLogo = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <rect width="32" height="32" rx="9" fill="var(--color-pine-950)" />
    <circle cx="16" cy="11.5" r="3.6" fill="var(--color-limey)" />
    <path d="M7.5 24.5c1.6-4.4 4.9-6.6 8.5-6.6s6.9 2.2 8.5 6.6" stroke="var(--color-moss-400)" strokeWidth="2.3" fill="none" strokeLinecap="round" />
  </svg>
);

export const IconPulse = (p: IP) => (
  <I {...p}><path d="M3 12h4l2.2-6 3.6 12L15 9l1.4 3H21" /></I>
);
export const IconPipeline = (p: IP) => (
  <I {...p}><rect x="3" y="4" width="5" height="16" rx="1.4" /><rect x="10" y="4" width="5" height="11" rx="1.4" /><rect x="17" y="4" width="5" height="7" rx="1.4" /></I>
);
export const IconCompany = (p: IP) => (
  <I {...p}><path d="M4 20V6.5L12 3v17M12 20h8v-9.5L12 8" /><path d="M7 9h2M7 12.5h2M7 16h2M15 12h2M15 15.5h2" /><path d="M2.5 20h19" /></I>
);
export const IconPeople = (p: IP) => (
  <I {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c.7-3.8 2.8-5.7 5.5-5.7s4.8 1.9 5.5 5.7" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16.2 14.6c2.3.3 3.8 2 4.3 4.9" /></I>
);
export const IconAgent = (p: IP) => (
  <I {...p}><circle cx="12" cy="6" r="2.6" /><path d="M12 8.6v3M12 11.6l-5.5 4M12 11.6l5.5 4" /><circle cx="5" cy="17" r="2.2" /><circle cx="19" cy="17" r="2.2" /><circle cx="12" cy="20" r="1.4" /><path d="M12 11.6V20" opacity=".45" /></I>
);
export const IconSliders = (p: IP) => (
  <I {...p}><path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h9M17 17h3" /><circle cx="15" cy="7" r="1.8" /><circle cx="9" cy="12" r="1.8" /><circle cx="15" cy="17" r="1.8" /></I>
);
export const IconSearch = (p: IP) => (
  <I {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="m15.2 15.2 4.3 4.3" /></I>
);
export const IconPlus = (p: IP) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const IconX = (p: IP) => <I {...p}><path d="m6 6 12 12M18 6 6 18" /></I>;
export const IconCheck = (p: IP) => <I {...p}><path d="m4.5 12.5 5 5L19.5 7" /></I>;
export const IconClock = (p: IP) => (
  <I {...p}><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2.2" /></I>
);
export const IconLedger = (p: IP) => (
  <I {...p}><path d="M5 3.5h13a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" /><path d="M8 3.5v17M12 8h4M12 12h4" /></I>
);
export const IconGauge = (p: IP) => (
  <I {...p}><path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" /><path d="M12 13.8 15.5 9" /><circle cx="12" cy="14.5" r="1.3" /></I>
);
export const IconChevron = (p: IP) => <I {...p}><path d="m9 6 6 6-6 6" /></I>;
export const IconSend = (p: IP) => <I {...p}><path d="M4 11.5 20 4l-4.5 16-4-6.5Z" /><path d="m11.5 13.5 4-4" /></I>;
export const IconPause = (p: IP) => <I {...p}><path d="M9 5.5v13M15 5.5v13" /></I>;
export const IconPlay = (p: IP) => <I {...p}><path d="M8 5.5v13l10-6.5Z" /></I>;
export const IconMail = (p: IP) => (
  <I {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7.5 7.5 6 7.5-6" /></I>
);
export const IconBranch = (p: IP) => (
  <I {...p}><circle cx="7" cy="6" r="2.2" /><circle cx="7" cy="18" r="2.2" /><circle cx="17" cy="9" r="2.2" /><path d="M7 8.2v7.6M17 11.2c0 3-2.5 4.3-7.5 4.6" /></I>
);
export const IconGitHub = (p: IP) => (
  <I {...p}><path d="M14.5 20.5v-3.2c0-.9-.2-1.5-.7-1.9 2.5-.3 4.7-1.3 4.7-5.2 0-1.1-.4-2-1.1-2.8.1-.3.5-1.4-.1-2.9 0 0-.9-.3-3 1.1a10 10 0 0 0-5.6 0C6.6 4.2 5.7 4.5 5.7 4.5c-.6 1.5-.2 2.6-.1 2.9-.7.8-1.1 1.7-1.1 2.8 0 3.9 2.2 4.9 4.7 5.2-.4.3-.6.8-.7 1.4-.6.3-2 .7-2.9-.8-.5-.9-1.2-1-1.2-1" /><path d="M9.5 20.5v-2.7" /><path d="M4 18.5c2.5.8 5 .8 8 .5 3 .3 5.5.3 8-.5" opacity="0" /></I>
);
export const IconSpark = (p: IP) => (
  <I {...p}><path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9Z" /></I>
);
export const IconDrag = (p: IP) => (
  <I {...p} strokeWidth={2.2}><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></I>
);

/* ---------------- primitivas ---------------- */

export function Btn({
  children,
  onClick,
  kind = "solid",
  className,
  title,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "solid" | "ghost" | "dark" | "danger" | "outline";
  className?: string;
  title?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "focus-ring inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none cursor-pointer select-none";
  const kinds = {
    solid: "bg-moss-600 text-moss-50 hover:bg-moss-500 px-3.5 py-2 shadow-sm",
    dark: "bg-pine-900 text-pine-100 hover:bg-pine-700 px-3.5 py-2 shadow-sm",
    ghost: "text-inksoft hover:bg-ink/6 px-2.5 py-1.5",
    outline: "border border-line bg-card text-ink hover:border-moss-400 hover:text-moss-700 px-3 py-1.5",
    danger: "border border-clay-500/35 text-clay-700 hover:bg-clay-100 px-3 py-1.5",
  } as const;
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} className={cx(base, kinds[kind], className)}>
      {children}
    </button>
  );
}

export function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cx("chip", className)}>{children}</span>;
}

export function Avatar({ name, color, size = 34 }: { name: string; color: string; size?: number }) {
  const init = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-display font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {init}
    </span>
  );
}

export function StrengthBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-moss-500" : pct >= 50 ? "bg-amber-500" : "bg-clay-500";
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-ink/10">
        <span className={cx("block h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[10.5px] font-semibold text-inksoft">{pct}%</span>
    </span>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h3 className="font-display text-[12px] font-semibold tracking-[0.14em] text-inkfaint uppercase">{children}</h3>
      {right}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pine-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-pop card relative max-h-[88vh] overflow-y-auto scroll-thin shadow-pop" style={{ width, maxWidth: "100%" }}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-5 py-3.5">
          <h2 className="font-display text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} className="focus-ring cursor-pointer rounded-md p-1 text-inkfaint transition hover:bg-ink/6 hover:text-ink" aria-label="Fechar">
            <IconX size={17} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Toasts({ list }: { list: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div
          key={t.id}
          className={cx(
            "anim-pop pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[13px] font-medium shadow-pop",
            t.tone === "ok" && "border-moss-200 bg-pine-900 text-pine-100",
            t.tone === "info" && "border-sky-500/30 bg-pine-900 text-pine-100",
            t.tone === "warn" && "border-amber-500/40 bg-pine-900 text-pine-100"
          )}
        >
          <span
            className={cx(
              "inline-block h-2 w-2 shrink-0 rounded-full",
              t.tone === "ok" && "bg-limey",
              t.tone === "info" && "bg-sky-500",
              t.tone === "warn" && "bg-amber-500"
            )}
          />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        "focus-ring relative h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-200",
        on ? "bg-moss-500" : "bg-ink/20"
      )}
    >
      <span
        className={cx(
          "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
          on ? "left-[21px]" : "left-[3px]"
        )}
      />
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[11px] font-semibold tracking-[0.1em] text-inkfaint uppercase">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "focus-ring w-full rounded-lg border border-line bg-white/70 px-3 py-2 text-[13.5px] text-ink placeholder:text-inkfaint transition focus:border-moss-400";
