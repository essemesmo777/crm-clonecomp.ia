import { useEffect, useRef } from "react";
import { cx, timeAgo, timeUntil, useStore } from "../store";
import { KIND_LABEL } from "../data";
import type { EventType } from "../types";
import { Btn, Chip, IconGauge, IconPause, IconPlay, SectionLabel } from "../ui";

const DOT: Record<EventType, string> = {
  tool: "bg-moss-400",
  fact: "bg-limey",
  suggest: "bg-amber-500",
  question: "bg-sky-500",
  answer: "bg-moss-300",
  lease: "bg-pine-100",
  system: "bg-pine-100/40",
  budget: "bg-clay-500",
  human: "bg-sky-500",
  skip: "bg-amber-500",
  recheck: "bg-moss-300",
};

function Queue() {
  const { state } = useStore();
  const order = { leased: 0, due: 1, done: 2 } as const;
  const tasks = [...state.tasks].sort(
    (a, b) => order[a.status] - order[b.status] || a.dueAt - b.dueAt
  );
  return (
    <section className="card flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <SectionLabel right={<span className="font-mono text-[10.5px] text-inkfaint">{tasks.filter((t) => t.status !== "done").length} vivas</span>}>
          Fila de trabalho
        </SectionLabel>
        <p className="-mt-1 text-[11px] text-inkfaint">o agente aluga o que venceu — nada de cron</p>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto scroll-thin p-2.5">
        {tasks.length === 0 && <p className="py-6 text-center text-[12px] text-inkfaint">fila vazia</p>}
        {tasks.map((t) => (
          <div
            key={t.id}
            className={cx(
              "rounded-lg border p-2.5 transition-all",
              t.status === "leased" && "lease-stripes border-amber-500/40 bg-amber-100/30",
              t.status === "due" && "border-line bg-white/60",
              t.status === "done" && "border-transparent opacity-45"
            )}
          >
            <div className="flex items-center gap-2">
              <code className="rounded bg-pine-900 px-1.5 py-px font-mono text-[10px] font-medium text-limey">
                {KIND_LABEL[t.kind]}
              </code>
              {t.status === "leased" && <Chip className="bg-amber-500/90 text-pine-950">em lease</Chip>}
              {t.status === "done" && <Chip className="bg-moss-100 text-moss-700">✓ feita</Chip>}
              {t.status === "due" && (
                <span className={cx("ml-auto font-mono text-[10.5px] font-semibold", t.dueAt <= Date.now() ? "text-moss-700" : "text-inkfaint")}>
                  {t.dueAt <= Date.now() ? "vencida — elegível" : timeUntil(t.dueAt)}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12.5px] font-medium leading-snug">{t.label}</p>
            <p className="mt-0.5 font-mono text-[10.5px] text-inkfaint">{t.targetName}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Terminal() {
  const { state } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const events = [...state.log].sort((a, b) => a.ts - b.ts).slice(-70);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.log.length]);

  return (
    <section className="card console-scan flex min-h-0 flex-col overflow-hidden !border-pine-700/60 !bg-pine-950">
      <div className="flex items-center gap-2.5 border-b border-pine-800 px-4 py-3">
        <span className={cx("h-2 w-2 rounded-full", state.running ? "pulse-live bg-limey" : "bg-amber-500")} />
        <h3 className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-pine-100/70">
          Sessão ao vivo
        </h3>
        <span className="ml-auto font-mono text-[10px] text-pine-100/40">
          eve · checkpoint durável · egress deny-all
        </span>
      </div>
      <div ref={ref} className="min-h-0 flex-1 overflow-y-auto scroll-dark px-3.5 py-3 font-mono text-[11.5px] leading-relaxed">
        {events.map((e) => (
          <div key={e.id} className="anim-log group flex items-start gap-2 rounded-md px-1.5 py-[3px] transition hover:bg-pine-800/60">
            <span className={cx("mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full opacity-80", DOT[e.type])} />
            <span className="shrink-0 text-pine-100/30">{new Date(e.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className={cx(
              "min-w-0",
              e.type === "fact" && "text-limey",
              e.type === "suggest" && "text-amber-500",
              e.type === "question" && "text-sky-500",
              e.type === "skip" && "text-amber-500/90",
              e.type === "budget" && "text-clay-500",
              e.type === "system" && "text-pine-100/55",
              e.type === "lease" && "text-pine-100/85",
              (e.type === "tool" || e.type === "human" || e.type === "answer" || e.type === "recheck") && "text-pine-100/85"
            )}>
              {e.tool && <span className="mr-1.5 rounded bg-pine-800 px-1 py-px text-[10px] text-moss-300">{e.tool}</span>}
              {e.text}
              {e.cost ? <span className="ml-1.5 text-[10px] text-pine-100/35">−{e.cost}</span> : null}
            </span>
          </div>
        ))}
        {state.running ? (
          <p className="cursor-blink px-1.5 pt-2 text-pine-100/60">agente pensando</p>
        ) : (
          <p className="px-1.5 pt-2 text-amber-500">— sessão suspensa: {state.budget.spent >= state.budget.total ? "orçamento esgotado" : "pausa do operador"}</p>
        )}
      </div>
    </section>
  );
}

function Rail() {
  const { state, toggleRun, refillBudget, answerQuestion } = useStore();
  const pct = Math.min(100, Math.round((state.budget.spent / state.budget.total) * 100));
  const left = state.budget.total - state.budget.spent;
  const openQs = state.questions.filter((q) => q.status === "open");
  const rechecks = state.rechecks.filter((r) => !r.done).sort((a, b) => a.dueAt - b.dueAt).slice(0, 4);
  const st = state.settings;

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto scroll-thin pr-0.5">
      <section className="card p-4">
        <SectionLabel right={<IconGauge size={15} className={cx(left < 40 ? "text-clay-500" : "text-moss-600")} />}>
          Orçamento de pesquisa
        </SectionLabel>
        <div className="flex items-end justify-between">
          <p className="font-mono text-[24px] font-bold leading-none">{left}<span className="text-[13px] font-semibold text-inkfaint">/{state.budget.total}</span></p>
          <p className="font-mono text-[10.5px] text-inkfaint">{pct}% consumido</p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink/10">
          <div className={cx("h-full rounded-full transition-all duration-700", pct > 85 ? "bg-clay-500" : "bg-moss-500")} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-inkfaint">
          Cada ferramenta cobra créditos. Quando acaba, o agente para sozinho — fechar o navegador não muda nada.
        </p>
        <div className="mt-3 flex gap-2">
          <Btn kind="outline" onClick={toggleRun} className="flex-1 justify-center">
            {state.running ? <IconPause size={14} /> : <IconPlay size={14} />}
            {state.running ? "Pausar" : "Retomar"}
          </Btn>
          <Btn kind="solid" onClick={refillBudget} className="flex-1 justify-center" disabled={left === state.budget.total && state.running}>
            Recarregar
          </Btn>
        </div>
      </section>

      <section className="card p-4">
        <SectionLabel>Fontes desta instalação</SectionLabel>
        <ul className="space-y-1.5 font-mono text-[11.5px]">
          {[
            { on: !!st.webResearchKey, label: "Web research (PERPLEXITY_API_KEY)" },
            { on: !!st.contextKey, label: "Company brand data (Context)" },
            { on: !!st.contextKey, label: "LinkedIn (Context)" },
            { on: st.mailboxSync, label: "Mailbox sync" },
            { on: !!st.bridgeSecret, label: "Ponte do agente (conversa)" },
          ].map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className={cx("h-1.5 w-1.5 rounded-full", s.on ? "bg-moss-500" : "bg-ink/25")} />
              <span className={s.on ? "text-ink" : "text-inkfaint line-through decoration-ink/30"}>
                {s.on ? "on " : "off"}  {s.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <SectionLabel right={openQs.length > 0 ? <Chip className="bg-sky-100 text-sky-700">{openQs.length} aberta{openQs.length > 1 ? "s" : ""}</Chip> : undefined}>
          Perguntas ao rep
        </SectionLabel>
        {openQs.length === 0 && <p className="py-1 text-[12px] text-inkfaint">Nada em aberto — o agente só pergunta quando não consegue decidir.</p>}
        <div className="space-y-3">
          {openQs.map((q) => (
            <div key={q.id} className="rounded-xl border border-sky-500/30 bg-sky-100/40 p-3">
              <p className="text-[12.5px] font-semibold leading-snug">{q.text}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-inksoft">{q.context}</p>
              <div className="mt-2.5 space-y-1.5">
                {q.options.map((o, i) => (
                  <button
                    key={o}
                    onClick={() => answerQuestion(q.id, o, i)}
                    className="focus-ring w-full cursor-pointer rounded-lg border border-line bg-card px-3 py-2 text-left text-[12px] font-medium transition hover:border-sky-500 hover:bg-sky-100 active:scale-[0.98]"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <SectionLabel>Rechecks com motivo</SectionLabel>
        {rechecks.length === 0 && <p className="py-1 text-[12px] text-inkfaint">Nenhum follow-up agendado.</p>}
        <div className="space-y-2">
          {rechecks.map((r) => (
            <div key={r.id} className="rounded-lg border border-line bg-white/60 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12.5px] font-semibold">{r.targetName}</p>
                <span className="shrink-0 font-mono text-[10.5px] font-semibold text-amber-700">{timeUntil(r.dueAt)}</span>
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-inksoft">“{r.reason}”</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 border-t border-line pt-2 font-mono text-[10px] text-inkfaint">
          um agente que não sabe dizer por que volta não tem um motivo — tem um default
        </p>
      </section>
    </div>
  );
}

export function AgentConsole() {
  const { state } = useStore();
  const spent = state.budget.spent;
  return (
    <div className="mx-auto grid h-full max-w-[1380px] grid-rows-[auto_1fr] gap-4 px-6 py-5">
      <div className="anim-rise flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11.5px] text-inksoft">
        <span><b className="text-ink">{state.tasks.filter((t) => t.status === "done").length}</b> tarefas feitas</span>
        <span><b className="text-ink">{state.log.length}</b> passos na sessão</span>
        <span><b className="text-ink">{spent}</b> créditos gastos</span>
        <span className="text-inkfaint">18 ferramentas · 4 skills · 1 schedule · sandbox sem rede e sem DATABASE_URL</span>
      </div>
      <div className="grid min-h-0 gap-4 lg:grid-cols-[280px_1fr_320px]">
        <Queue />
        <Terminal />
        <Rail />
      </div>
    </div>
  );
}
