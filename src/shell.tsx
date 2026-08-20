import { useMemo, useRef, useState, type ReactNode } from "react";
import { cx, fmtBRLc, useStore } from "./store";
import { STAGES } from "./data";
import type { View } from "./types";
import {
  Avatar,
  Btn,
  Chip,
  IconAgent,
  IconCompany,
  IconGitHub,
  IconLogo,
  IconPause,
  IconPeople,
  IconPipeline,
  IconPlay,
  IconPlus,
  IconPulse,
  IconSearch,
  IconSliders,
} from "./ui";

const NAV: Array<{ id: View; label: string; icon: (p: { size?: number }) => ReactNode }> = [
  { id: "dashboard", label: "Visão geral", icon: (p) => <IconPulse {...p} /> },
  { id: "pipeline", label: "Pipeline", icon: (p) => <IconPipeline {...p} /> },
  { id: "companies", label: "Empresas", icon: (p) => <IconCompany {...p} /> },
  { id: "contacts", label: "Contatos", icon: (p) => <IconPeople {...p} /> },
  { id: "agent", label: "Agente", icon: (p) => <IconAgent {...p} /> },
  { id: "settings", label: "Ajustes", icon: (p) => <IconSliders {...p} /> },
];

export function Sidebar() {
  const { state, view, setView } = useStore();
  const pending =
    state.suggestions.filter((s) => s.status === "pending").length +
    state.questions.filter((q) => q.status === "open").length;
  const pct = Math.min(100, Math.round((state.budget.spent / state.budget.total) * 100));
  const { toggleRun } = useStore();

  return (
    <aside className="relative z-10 flex h-full w-[228px] shrink-0 flex-col border-r border-pine-700/60 bg-pine-900 text-pine-100">
      <div className="flex items-center gap-2.5 px-4 pb-5 pt-5">
        <IconLogo size={30} />
        <div className="leading-tight">
          <p className="font-display text-[15px] font-bold tracking-tight text-white">Comp AI CRM</p>
          <p className="font-mono text-[10px] text-pine-100/45">agentic-first · MIT</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2.5">
        {NAV.map((n) => {
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cx(
                "focus-ring group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                active ? "bg-moss-600/25 text-white shadow-[inset_2px_0_0_var(--color-limey)]" : "text-pine-100/65 hover:bg-pine-800 hover:text-pine-100"
              )}
            >
              <span className={cx("transition-colors", active ? "text-limey" : "text-pine-100/45 group-hover:text-pine-100")}>
                {n.icon({ size: 17 })}
              </span>
              {n.label}
              {n.id === "agent" && pending > 0 && (
                <span className="ml-auto rounded-full bg-amber-500/90 px-1.5 py-px font-mono text-[10px] font-bold text-pine-950">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-pine-700/70 bg-pine-850 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                state.running ? "pulse-live bg-limey" : "bg-amber-500"
              )}
            />
            <span className="font-display text-[12px] font-semibold text-white">
              {state.running ? "Agente rodando" : state.budget.spent >= state.budget.total ? "Sem orçamento" : "Pausado"}
            </span>
          </div>
          <button
            onClick={toggleRun}
            className="focus-ring cursor-pointer rounded-md p-1 text-pine-100/60 transition hover:bg-pine-700 hover:text-white"
            title={state.running ? "Pausar agente" : "Retomar agente"}
          >
            {state.running ? <IconPause size={14} /> : <IconPlay size={14} />}
          </button>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-pine-700">
          <div
            className={cx("h-full rounded-full transition-all duration-700", pct > 85 ? "bg-clay-500" : "bg-moss-400")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-pine-100/45">
          {state.budget.total - state.budget.spent}/{state.budget.total} créditos de pesquisa
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-pine-700/60 px-4 py-3">
        <span className="font-mono text-[10px] text-pine-100/40">release · v1.4.2</span>
        <a
          href="https://github.com/trycompai/crm"
          target="_blank"
          rel="noreferrer"
          className="focus-ring flex items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-[10px] text-pine-100/55 transition hover:bg-pine-800 hover:text-white"
        >
          <IconGitHub size={14} /> trycompai/crm
        </a>
      </div>
    </aside>
  );
}

export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  const { state, openRecord, setDealModal } = useStore();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    return {
      companies: state.companies.filter((c) => (c.name + c.domain + c.industry).toLowerCase().includes(term)).slice(0, 4),
      contacts: state.contacts.filter((p) => (p.name + p.title + p.email).toLowerCase().includes(term)).slice(0, 4),
      deals: state.deals.filter((d) => d.name.toLowerCase().includes(term)).slice(0, 3),
    };
  }, [q, state]);

  const none = results && results.companies.length + results.contacts.length + results.deals.length === 0;

  return (
    <header className="relative z-20 flex items-center gap-4 border-b border-line bg-paper/80 px-6 py-3.5 backdrop-blur">
      <div className="min-w-0">
        <h1 className="font-display text-[19px] font-bold tracking-tight">{title}</h1>
        <p className="truncate text-[12px] text-inkfaint">{subtitle}</p>
      </div>

      <div className="relative ml-auto w-[300px] max-w-full">
        <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-inkfaint" />
        <input
          id="global-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (blurTimer.current) window.clearTimeout(blurTimer.current);
            setFocus(true);
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setFocus(false), 140);
          }}
          placeholder="Buscar registro…  ( / )"
          className="focus-ring w-full rounded-lg border border-line bg-card py-2 pl-9 pr-3 text-[13px] placeholder:text-inkfaint transition focus:border-moss-400"
        />
        {focus && results && (
          <div className="anim-pop card absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[380px] overflow-y-auto scroll-thin p-1.5 shadow-pop">
            {none && <p className="px-3 py-4 text-center text-[12.5px] text-inkfaint">Nada no ledger com esse nome.</p>}
            {results.companies.length > 0 && (
              <ResultGroup label="Empresas">
                {results.companies.map((c) => (
                  <ResultRow
                    key={c.id}
                    onClick={() => {
                      openRecord({ kind: "company", id: c.id, tab: "resumo" });
                      setQ("");
                    }}
                  >
                    <Avatar name={c.name} color={c.color} size={26} />
                    <span className="truncate font-medium">{c.name}</span>
                    <Chip className="ml-auto bg-pine-100 text-pine-700">{c.industry}</Chip>
                  </ResultRow>
                ))}
              </ResultGroup>
            )}
            {results.contacts.length > 0 && (
              <ResultGroup label="Contatos">
                {results.contacts.map((p) => {
                  const co = state.companies.find((c) => c.id === p.companyId);
                  return (
                    <ResultRow
                      key={p.id}
                      onClick={() => {
                        openRecord({ kind: "contact", id: p.id, tab: "resumo" });
                        setQ("");
                      }}
                    >
                      <Avatar name={p.name} color={co?.color ?? "#2F4A3C"} size={26} />
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="ml-auto truncate pl-2 text-[11.5px] text-inkfaint">{p.title}</span>
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}
            {results.deals.length > 0 && (
              <ResultGroup label="Negociações">
                {results.deals.map((d) => (
                  <ResultRow
                    key={d.id}
                    onClick={() => {
                      openRecord({ kind: "deal", id: d.id, tab: "resumo" });
                      setQ("");
                    }}
                  >
                    <span className={cx("h-2 w-2 shrink-0 rounded-full", STAGES[d.stage].dot)} />
                    <span className="truncate font-medium">{d.name}</span>
                    <span className="ml-auto font-mono text-[11.5px] font-semibold text-moss-700">{fmtBRLc(d.value)}</span>
                  </ResultRow>
                ))}
              </ResultGroup>
            )}
          </div>
        )}
      </div>

      <Btn kind="dark" onClick={() => setDealModal(true)}>
        <IconPlus size={15} /> Nova negociação
      </Btn>
    </header>
  );
}

function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-2.5 pb-1 pt-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-inkfaint">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="focus-ring flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition hover:bg-moss-50"
    >
      {children}
    </button>
  );
}
