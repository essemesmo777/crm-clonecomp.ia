import { useEffect, useRef, useState } from "react";
import { cx, fmtBRLc, timeAgo, timeUntil, useStore } from "../store";
import { STAGES, STAGE_ORDER } from "../data";
import { Btn, Chip, IconCheck, IconClock, IconSpark, IconX, SectionLabel, StrengthBar } from "../ui";
import type { EventType } from "../types";

function useCountUp(target: number, dur = 750) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (target - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

const EVENT_DOT: Record<EventType, string> = {
  tool: "bg-moss-400",
  fact: "bg-limey",
  suggest: "bg-amber-500",
  question: "bg-sky-500",
  answer: "bg-moss-400",
  lease: "bg-pine-100",
  system: "bg-ink/30",
  budget: "bg-clay-500",
  human: "bg-sky-500",
  skip: "bg-amber-500",
  recheck: "bg-moss-300",
};

function Kpi({ label, value, suffix, note, tone = "moss" }: { label: string; value: number; suffix?: string; note: string; tone?: "moss" | "amber" | "sky" }) {
  const v = useCountUp(value);
  return (
    <div className="card group relative overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.13em] text-inkfaint">{label}</p>
      <p className="mt-2 font-mono text-[26px] font-bold leading-none tracking-tight">
        {suffix === "R$" ? `R$ ${v.toLocaleString("pt-BR")}` : v.toLocaleString("pt-BR")}
        {suffix && suffix !== "R$" && <span className="text-[15px] font-semibold text-inksoft"> {suffix}</span>}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-inkfaint">
        <span className={cx("h-1.5 w-1.5 rounded-full", tone === "moss" && "bg-moss-500", tone === "amber" && "bg-amber-500", tone === "sky" && "bg-sky-500")} />
        {note}
      </p>
    </div>
  );
}

export function Dashboard() {
  const { state, approveSuggestion, rejectSuggestion, setView, openRecord } = useStore();

  const open = state.deals.filter((d) => d.stage !== "ganho" && d.stage !== "perdido");
  const pipeline = open.reduce((a, d) => a + d.value, 0);
  const weighted = Math.round(open.reduce((a, d) => a + d.value * STAGES[d.stage].prob, 0));
  const pending = state.suggestions.filter((s) => s.status === "pending");
  const openQs = state.questions.filter((q) => q.status === "open");
  const nextRechecks = state.rechecks.filter((r) => !r.done).sort((a, b) => a.dueAt - b.dueAt);

  const perStage = STAGE_ORDER.map((st) => ({
    st,
    total: state.deals.filter((d) => d.stage === st).reduce((a, d) => a + d.value, 0),
    count: state.deals.filter((d) => d.stage === st).length,
  }));
  const max = Math.max(...perStage.map((p) => p.total), 1);

  const feed = [...state.log].sort((a, b) => b.ts - a.ts).slice(0, 12);
  const dueCount = state.tasks.filter((t) => t.status === "due" && t.dueAt <= Date.now()).length;

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      {/* régua de status do agente — abre a página, não um hero */}
      <div className="card anim-rise mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 overflow-hidden border-pine-700/60 bg-pine-900 p-4 text-pine-100">
        <div className="flex items-center gap-3">
          <span className={cx("h-2.5 w-2.5 rounded-full", state.running ? "pulse-live bg-limey" : "bg-amber-500")} />
          <div>
            <p className="font-display text-[14px] font-bold text-white">
              {state.running ? "O agente está rodando sozinho" : state.budget.spent >= state.budget.total ? "Orçamento esgotado — agente parado por regra" : "Agente pausado"}
            </p>
            <p className="font-mono text-[11px] text-pine-100/55">
              sessão durável ativa · {dueCount} tarefa{dueCount === 1 ? "" : "s"} vencida{dueCount === 1 ? "" : "s"} na fila · último passo {feed[0] ? timeAgo(feed[0].ts) : "—"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-5 font-mono text-[11px] text-pine-100/60">
          <span>orçamento <b className="text-white">{state.budget.total - state.budget.spent}</b>/{state.budget.total}</span>
          <span>rechecks <b className="text-white">{nextRechecks.length}</b></span>
          <span>perguntas <b className="text-amber-500">{openQs.length}</b></span>
          <Btn kind="outline" className="!border-pine-600 !bg-pine-800 !text-pine-100 hover:!border-limey hover:!text-limey" onClick={() => setView("agent")}>
            <IconSpark size={14} /> Abrir console
          </Btn>
        </div>
      </div>

      <div className="stagger mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Kpi label="Pipeline aberto" value={pipeline} suffix="R$" note={`${open.length} negociações vivas`} />
        <Kpi label="Previsão ponderada" value={weighted} suffix="R$" note="probabilidade por estágio" tone="sky" />
        <Kpi label="Sugestões pendentes" value={pending.length} note="evidência fraca esperando você" tone="amber" />
        <Kpi label="Fatos no ledger" value={state.companies.reduce((a, c) => a + c.facts.length, 0) + state.contacts.reduce((a, p) => a + p.facts.length, 0)} note="só fato observado entra" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        {/* feed ao vivo */}
        <section className="card flex min-h-[420px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <SectionLabel right={
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-inkfaint">
                {state.running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss-500" />} ao vivo
              </span>
            }>Registro do agente</SectionLabel>
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto scroll-thin p-2.5">
            {feed.map((e) => (
              <div key={e.id} className="anim-log flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-moss-50/70">
                <span className={cx("mt-[5px] h-2 w-2 shrink-0 rounded-full", EVENT_DOT[e.type])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug text-ink">
                    {e.tool && <code className="mr-1.5 rounded bg-pine-900 px-1.5 py-px font-mono text-[10.5px] font-medium text-limey">{e.tool}</code>}
                    {e.text}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-inkfaint">
                    {timeAgo(e.ts)}{e.targetName ? ` · ${e.targetName}` : ""}{e.cost ? ` · −${e.cost} créditos` : ""}
                  </p>
                </div>
                {e.targetId && (
                  <button
                    onClick={() => openRecord({ kind: state.contacts.some((p) => p.id === e.targetId) ? "contact" : "company", id: e.targetId!, tab: "agente" })}
                    className="focus-ring shrink-0 cursor-pointer rounded-md border border-line px-2 py-1 font-mono text-[10px] text-inkfaint transition hover:border-moss-400 hover:text-moss-700"
                  >
                    registro ↗
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          {/* sugestões */}
          <section className="card p-4">
            <SectionLabel right={<Chip className="bg-amber-100 text-amber-700">{pending.length} pendentes</Chip>}>
              Humanos decidem
            </SectionLabel>
            {pending.length === 0 && (
              <p className="py-3 text-center text-[12.5px] text-inkfaint">Nenhuma evidência fraca esperando. O agente avisa quando tiver.</p>
            )}
            <div className="space-y-2.5">
              {pending.slice(0, 3).map((s) => (
                <div key={s.id} className="anim-pop rounded-lg border border-line bg-white/60 p-3">
                  <p className="text-[12.5px] leading-snug">{s.text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded bg-pine-100 px-1.5 py-px font-mono text-[10px] text-pine-700">{s.source}</code>
                    <StrengthBar value={s.strength} />
                    <span className="ml-auto flex gap-1">
                      <button onClick={() => approveSuggestion(s.id)} className="focus-ring cursor-pointer rounded-md bg-moss-600 p-1.5 text-moss-50 transition hover:bg-moss-500 active:scale-90" title="Aceitar e gravar">
                        <IconCheck size={13} />
                      </button>
                      <button onClick={() => rejectSuggestion(s.id)} className="focus-ring cursor-pointer rounded-md border border-line p-1.5 text-inkfaint transition hover:bg-clay-100 hover:text-clay-700 active:scale-90" title="Rejeitar">
                        <IconX size={13} />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {pending.length > 3 && (
              <button onClick={() => setView("agent")} className="focus-ring mt-2 cursor-pointer font-mono text-[11px] text-moss-700 underline-offset-2 hover:underline">
                +{pending.length - 3} no console do agente →
              </button>
            )}
          </section>

          {/* rechecks */}
          <section className="card p-4">
            <SectionLabel>Agenda própria do agente</SectionLabel>
            {nextRechecks.length === 0 && <p className="py-2 text-center text-[12.5px] text-inkfaint">Nenhum recheck marcado.</p>}
            <div className="space-y-2">
              {nextRechecks.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-start gap-2.5 rounded-lg border border-line bg-white/60 p-2.5">
                  <span className="mt-0.5 text-moss-600"><IconClock size={15} /></span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold leading-tight">{r.targetName} <span className="font-mono text-[10.5px] font-medium text-amber-700">· {timeUntil(r.dueAt)}</span></p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-inksoft">“{r.reason}”</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* previsão por estágio */}
      <section className="card mt-5 p-4">
        <SectionLabel right={<span className="font-mono text-[11px] text-inkfaint">altura = valor em jogo · largura da barra pondera probabilidade</span>}>
          Previsão por estágio
        </SectionLabel>
        <div className="flex h-[150px] items-end gap-3">
          {perStage.map((p, i) => (
            <div key={p.st} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[10.5px] font-semibold text-inksoft opacity-0 transition group-hover:opacity-100">{fmtBRLc(p.total)}</span>
              <div
                className="bar-anim w-full rounded-t-md transition-all duration-200 group-hover:opacity-80"
                style={{
                  height: `${Math.max(4, (p.total / max) * 100)}%`,
                  animationDelay: `${i * 70}ms`,
                  background: `linear-gradient(180deg, var(--color-moss-400), var(--color-moss-600))`,
                  maxWidth: `${28 + STAGES[p.st].prob * 72}%`,
                  margin: "0 auto",
                  opacity: p.st === "perdido" ? 0.45 : 1,
                }}
              />
              <span className="text-[11px] font-medium text-inkfaint">{STAGES[p.st].label}</span>
              <span className="font-mono text-[10px] text-inkfaint">{p.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
