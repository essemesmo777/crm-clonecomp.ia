import { useMemo, useState } from "react";
import { cx, fmtBRLc, timeAgo, timeUntil, useStore } from "../store";
import { STAGES } from "../data";
import type { AgentEvent, Company, Contact, Deal, EventType, IdentityStatus } from "../types";
import { Avatar, Btn, Chip, IconAgent, IconClock, IconLedger, IconMail, IconSend, IconSliders, SectionLabel, StrengthBar } from "../ui";

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

export function IdentityChip({ status, score, source }: { status: IdentityStatus; score: number; source: string }) {
  if (status === "confirmed")
    return <Chip className="bg-moss-100 text-moss-700">confirmado · {Math.round(score * 100)}% · {source}</Chip>;
  if (status === "suggestion")
    return <Chip className="bg-amber-100 text-amber-700">sugestão pendente · {Math.round(score * 100)}%</Chip>;
  if (status === "question")
    return <Chip className="bg-sky-100 text-sky-700">pergunta aberta ao rep</Chip>;
  return <Chip className="bg-ink/8 text-inksoft">não confirmado</Chip>;
}

/* ---------------- listas ---------------- */

export function Companies() {
  const { state, openRecord } = useStore();
  return (
    <div className="mx-auto max-w-[1020px] px-6 py-6">
      <p className="mb-4 text-[13px] text-inksoft">
        {state.companies.length} contas · o agente preenche os campos sozinho quando a evidência é forte — o resto vira sugestão.
      </p>
      <div className="stagger space-y-2.5">
        {state.companies.map((c) => (
          <CompanyRow key={c.id} c={c} onOpen={() => openRecord({ kind: "company", id: c.id, tab: "resumo" })} />
        ))}
      </div>
    </div>
  );
}

function CompanyRow({ c, onOpen }: { c: Company; onOpen: () => void }) {
  const { state } = useStore();
  const deals = state.deals.filter((d) => d.companyId === c.id && d.stage !== "perdido");
  const open = deals.reduce((a, d) => a + d.value, 0);
  const people = state.contacts.filter((p) => p.companyId === c.id);
  const pending = state.suggestions.filter((s) => s.targetId === c.id && s.status === "pending").length;

  return (
    <button
      onClick={onOpen}
      className="focus-ring card group flex w-full cursor-pointer items-center gap-4 p-3.5 text-left transition-all duration-150 hover:-translate-y-px hover:border-moss-300 hover:shadow-pop"
    >
      <Avatar name={c.name} color={c.color} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-[15px] font-bold tracking-tight">{c.name}</p>
          <Chip className="bg-pine-100 text-pine-700">{c.industry}</Chip>
          {pending > 0 && <Chip className="bg-amber-100 text-amber-700">{pending} sugestão{pending > 1 ? "ões" : ""}</Chip>}
        </div>
        <p className="mt-0.5 truncate font-mono text-[11.5px] text-inkfaint">
          {c.domain} · {c.city} · {c.employees ? `${c.employees} pessoas` : "porte desconhecido — agente pesquisando"}
        </p>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono text-[14px] font-bold text-moss-700">{fmtBRLc(open)}</p>
        <p className="text-[11px] text-inkfaint">{deals.length} negociação{deals.length === 1 ? "" : "ões"} · {people.length} contato{people.length === 1 ? "" : "s"}</p>
      </div>
      <div className="hidden shrink-0 text-right md:block">
        <p className="text-[11px] font-semibold text-inksoft">{c.facts.length} fatos no ledger</p>
        <StrengthBar value={c.facts[0]?.strength ?? 0} className="justify-end" />
      </div>
      <span className="text-inkfaint transition group-hover:translate-x-0.5 group-hover:text-moss-600">→</span>
    </button>
  );
}

export function Contacts() {
  const { state, openRecord } = useStore();
  return (
    <div className="mx-auto max-w-[1020px] px-6 py-6">
      <p className="mb-4 text-[13px] text-inksoft">
        {state.contacts.length} pessoas · nada sobre alguém é achado: ou a evidência é forte, ou um humano liquida.
      </p>
      <div className="stagger space-y-2.5">
        {state.contacts.map((p) => {
          const co = state.companies.find((c) => c.id === p.companyId);
          return (
            <button
              key={p.id}
              onClick={() => openRecord({ kind: "contact", id: p.id, tab: "resumo" })}
              className="focus-ring card group flex w-full cursor-pointer items-center gap-4 p-3.5 text-left transition-all duration-150 hover:-translate-y-px hover:border-moss-300 hover:shadow-pop"
            >
              <Avatar name={p.name} color={co?.color ?? "#2F4A3C"} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14.5px] font-bold tracking-tight">{p.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-inkfaint">
                  {p.title} · {co?.name}
                </p>
              </div>
              <code className="hidden shrink-0 rounded bg-ink/6 px-2 py-1 font-mono text-[11px] text-inksoft lg:block">
                <IconMail size={12} className="mr-1 inline" />
                {p.email}
              </code>
              <div className="shrink-0">
                <IdentityChip {...p.identity} />
              </div>
              <span className="text-inkfaint transition group-hover:translate-x-0.5 group-hover:text-moss-600">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- drawer de registro ---------------- */

function AgentTab({ targetId, targetName }: { targetId: string; targetName: string }) {
  const { state, askRecord, setView } = useStore();
  const [q, setQ] = useState("");
  const events = useMemo(
    () => [...state.log].filter((e) => e.targetId === targetId).sort((a, b) => b.ts - a.ts),
    [state.log, targetId]
  );
  const bridgeOn = state.settings.bridgeSecret.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="console-scan min-h-0 flex-1 space-y-0.5 overflow-y-auto scroll-dark rounded-xl bg-pine-950 p-3">
        {events.length === 0 && (
          <p className="px-2 py-6 text-center font-mono text-[11.5px] text-pine-100/45">
            o agente ainda não tocou neste registro — a fila decide o que ele olha
          </p>
        )}
        {events.map((e: AgentEvent) => (
          <div key={e.id} className="anim-log flex items-start gap-2 rounded-lg px-2 py-1.5">
            <span className={cx("mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full", DOT[e.type])} />
            <div className="min-w-0">
              <p className="text-[12px] leading-snug text-pine-100/90">
                {e.tool && <code className="mr-1.5 rounded bg-pine-800 px-1.5 py-px font-mono text-[10px] text-limey">{e.tool}</code>}
                {e.text}
              </p>
              <p className="font-mono text-[9.5px] text-pine-100/35">{timeAgo(e.ts)}</p>
            </div>
          </div>
        ))}
        {state.running && <p className="cursor-blink px-2 pt-1 font-mono text-[11px] text-pine-100/50">sessão durável ativa</p>}
      </div>

      <div className="mt-3">
        {bridgeOn ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim().length < 3) return;
              askRecord(targetId, targetName, q.trim());
              setQ("");
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Pergunte ao registro de ${targetName}…`}
              className="focus-ring w-full rounded-lg border border-line bg-white/70 px-3 py-2 text-[13px] placeholder:text-inkfaint"
            />
            <Btn type="submit" kind="dark" className="!py-2">
              <IconSend size={14} />
            </Btn>
          </form>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-line bg-ink/[0.03] px-3 py-2.5">
            <IconAgent size={16} className="shrink-0 text-inkfaint" />
            <p className="text-[11.5px] leading-snug text-inksoft">
              A conversa está desligada: defina <code className="rounded bg-ink/8 px-1 font-mono text-[10.5px]">AGENT_BRIDGE_SECRET</code> para falar com o agente daqui. Ele segue a própria agenda mesmo assim.
            </p>
            <Btn kind="outline" className="ml-auto shrink-0 !px-2 !py-1 !text-[11.5px]" onClick={() => setView("settings")}>
              <IconSliders size={13} /> Ajustes
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecordDrawer() {
  const { state, record, openRecord } = useStore();
  if (!record) return null;

  const company = record.kind === "company" ? state.companies.find((c) => c.id === record.id) : undefined;
  const contact = record.kind === "contact" ? state.contacts.find((p) => p.id === record.id) : undefined;
  const deal = record.kind === "deal" ? state.deals.find((d) => d.id === record.id) : undefined;
  if (!company && !contact && !deal) return null;

  const title = company?.name ?? contact?.name ?? deal?.name ?? "";
  const targetId = record.kind === "deal" ? deal!.companyId : record.id;
  const targetName = record.kind === "deal" ? state.companies.find((c) => c.id === deal!.companyId)?.name ?? title : title;

  const co = contact ? state.companies.find((c) => c.id === contact.companyId) : company;
  const deals = state.deals.filter((d) => d.companyId === (deal?.companyId ?? company?.id ?? contact?.companyId));
  const facts = company?.facts ?? contact?.facts ?? [];
  const relatedEvents = state.log.filter((e) => e.targetId === targetId).length;
  const recheck = state.rechecks.find((r) => !r.done && r.targetId === targetId);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-pine-950/35 backdrop-blur-[1.5px]" onClick={() => openRecord(null)} />
      <aside className="anim-drawer absolute bottom-0 right-0 top-0 flex w-full max-w-[560px] flex-col border-l border-line bg-paper shadow-pop">
        <header className="border-b border-line bg-card px-5 pb-0 pt-4">
          <div className="flex items-start gap-3.5">
            <Avatar name={title} color={co?.color ?? "#2F4A3C"} size={46} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-[19px] font-bold tracking-tight">{title}</h2>
                {record.kind === "deal" && <Chip className={STAGES[deal!.stage].chip}>{STAGES[deal!.stage].label}</Chip>}
              </div>
              <p className="mt-0.5 truncate font-mono text-[11.5px] text-inkfaint">
                {company && `${company.domain} · ${company.industry}`}
                {contact && `${contact.title} · ${co?.name}`}
                {deal && `${state.companies.find((c) => c.id === deal.companyId)?.name} · ${fmtBRLc(deal.value)} · fecha ${new Date(deal.close + "T12:00:00").toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <button
              onClick={() => openRecord(null)}
              className="focus-ring cursor-pointer rounded-md p-1.5 text-inkfaint transition hover:bg-ink/6 hover:text-ink"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="mt-3.5 flex gap-1">
            {(["resumo", "agente"] as const).map((t) => (
              <button
                key={t}
                onClick={() => openRecord({ ...record, tab: t })}
                className={cx(
                  "focus-ring cursor-pointer rounded-t-lg border-b-2 px-3.5 pb-2 pt-1.5 font-display text-[13px] font-semibold capitalize transition",
                  record.tab === t ? "border-moss-500 text-moss-700" : "border-transparent text-inkfaint hover:text-ink"
                )}
              >
                {t === "agente" ? `Agente · ${relatedEvents}` : "Resumo"}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-5 py-4">
          {record.tab === "agente" ? (
            <div className="flex h-full flex-col">
              <AgentTab targetId={targetId} targetName={targetName} />
            </div>
          ) : (
            <div className="space-y-5 pb-6">
              {(company || contact) && (
                <section>
                  <SectionLabel>Ledger de fatos</SectionLabel>
                  {facts.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-inkfaint">
                      Nenhum fato forte ainda — antes vazio que errado. O agente preenche quando a evidência chegar.
                    </p>
                  )}
                  <div className="space-y-2">
                    {facts.map((f) => (
                      <div key={f.id} className="card flex items-start gap-3 p-3">
                        <IconLedger size={15} className="mt-0.5 shrink-0 text-moss-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] leading-snug">{f.text}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <code className="rounded bg-pine-100 px-1.5 py-px font-mono text-[10px] text-pine-700">{f.source}</code>
                            <StrengthBar value={f.strength} />
                            <Chip className={f.settled === "human" ? "bg-sky-100 text-sky-700" : "bg-moss-100 text-moss-700"}>
                              {f.settled === "human" ? "selo humano" : "escrito pelo agente"}
                            </Chip>
                            <span className="ml-auto font-mono text-[10px] text-inkfaint">{timeAgo(f.ts)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {contact && (
                <section>
                  <SectionLabel>Identidade</SectionLabel>
                  <div className="card flex items-center gap-3 p-3">
                    <IdentityChip {...contact.identity} />
                    <code className="font-mono text-[11.5px] text-inksoft">{contact.email}</code>
                    {contact.linkedin && <code className="ml-auto font-mono text-[10.5px] text-sky-700">{contact.linkedin}</code>}
                  </div>
                </section>
              )}

              {company && (
                <section>
                  <SectionLabel>Sobre</SectionLabel>
                  <div className="card p-3.5">
                    <p className="text-[13px] leading-relaxed text-inksoft">{company.brief}</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11.5px] text-inkfaint">
                      <span>{company.city}</span>
                      <span>{company.employees ? `${company.employees} funcionários` : "porte a descobrir"}</span>
                    </div>
                  </div>
                </section>
              )}

              {record.kind === "deal" && (
                <section>
                  <SectionLabel>Detalhes</SectionLabel>
                  <div className="card grid grid-cols-2 gap-3 p-3.5 font-mono text-[12px]">
                    <div><p className="text-inkfaint">Valor</p><p className="mt-0.5 text-[15px] font-bold text-moss-700">{fmtBRLc(deal!.value)}</p></div>
                    <div><p className="text-inkfaint">Dono</p><p className="mt-0.5 font-semibold">{deal!.owner}</p></div>
                    <div><p className="text-inkfaint">Contato</p><p className="mt-0.5 font-semibold">{state.contacts.find((p) => p.id === deal!.contactId)?.name ?? "—"}</p></div>
                    <div><p className="text-inkfaint">Fechamento</p><p className="mt-0.5 font-semibold">{new Date(deal!.close + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>
                  </div>
                </section>
              )}

              {deals.length > 0 && record.kind !== "deal" && (
                <section>
                  <SectionLabel>Negociações</SectionLabel>
                  <div className="space-y-2">
                    {deals.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => openRecord({ kind: "deal", id: d.id, tab: "resumo" })}
                        className="focus-ring card flex w-full cursor-pointer items-center gap-3 p-3 text-left transition hover:border-moss-300"
                      >
                        <span className={cx("h-2 w-2 shrink-0 rounded-full", STAGES[d.stage].dot)} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{d.name}</span>
                        <Chip className={STAGES[d.stage].chip}>{STAGES[d.stage].label}</Chip>
                        <span className="font-mono text-[12px] font-bold text-moss-700">{fmtBRLc(d.value)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {recheck && (
                <section>
                  <SectionLabel>Recheck agendado</SectionLabel>
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-100/50 p-3">
                    <IconClock size={15} className="mt-0.5 shrink-0 text-amber-700" />
                    <div>
                      <p className="font-mono text-[11px] font-semibold text-amber-700">{timeUntil(recheck.dueAt)}</p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-ink">“{recheck.reason}”</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
