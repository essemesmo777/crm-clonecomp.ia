import { useState, type DragEvent } from "react";
import { cx, fmtBRL, fmtBRLc, useStore } from "../store";
import { STAGES, STAGE_ORDER } from "../data";
import type { Deal, Stage } from "../types";
import { Avatar, Btn, Chip, Field, IconDrag, Modal, inputCls } from "../ui";

function DealCard({ d, onDragStart }: { d: Deal; onDragStart: (e: DragEvent, id: string) => void }) {
  const { state, openRecord } = useStore();
  const company = state.companies.find((c) => c.id === d.companyId);
  const contact = state.contacts.find((p) => p.id === d.contactId);
  const [drag, setDrag] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        setDrag(true);
        onDragStart(e, d.id);
      }}
      onDragEnd={() => setDrag(false)}
      onClick={() => openRecord({ kind: "deal", id: d.id, tab: "resumo" })}
      className={cx(
        "group cursor-grab rounded-xl border border-line bg-card p-3 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-moss-300 hover:shadow-pop active:cursor-grabbing",
        drag && "rotate-2 opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold leading-snug">{d.name}</p>
        <span className="text-inkfaint opacity-0 transition group-hover:opacity-100"><IconDrag size={13} /></span>
      </div>
      <p className="mt-0.5 text-[11.5px] text-inkfaint">{company?.name}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-mono text-[13px] font-bold text-moss-700">{fmtBRLc(d.value)}</span>
        <span className="font-mono text-[10.5px] text-inkfaint">
          {new Date(d.close + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
      {contact && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2">
          <Avatar name={contact.name} color={company?.color ?? "#2F4A3C"} size={20} />
          <span className="truncate text-[11px] font-medium text-inksoft">{contact.name}</span>
        </div>
      )}
    </div>
  );
}

export function Pipeline() {
  const { state, moveDeal } = useStore();
  const [over, setOver] = useState<Stage | null>(null);

  const onDrop = (e: DragEvent, stage: Stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/deal");
    setOver(null);
    if (id) moveDeal(id, stage);
  };

  return (
    <div className="flex h-full gap-3.5 overflow-x-auto scroll-thin px-6 py-5">
      {STAGE_ORDER.map((st, ci) => {
        const deals = state.deals.filter((d) => d.stage === st);
        const total = deals.reduce((a, d) => a + d.value, 0);
        const meta = STAGES[st];
        return (
          <div
            key={st}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(st);
            }}
            onDragLeave={() => setOver((o) => (o === st ? null : o))}
            onDrop={(e) => onDrop(e, st)}
            className={cx(
              "flex h-fit min-h-[70vh] w-[248px] shrink-0 flex-col rounded-xl border bg-ink/[0.028] transition-all duration-150",
              over === st ? "border-moss-400 bg-moss-50/70 shadow-pop" : "border-line/80"
            )}
            style={{ animation: `rise .4s ${ci * 50}ms cubic-bezier(.2,.7,.2,1) both` }}
          >
            <div className="flex items-center gap-2 px-3.5 pb-2 pt-3.5">
              <span className={cx("h-2 w-2 rounded-full", meta.dot)} />
              <span className="font-display text-[13px] font-bold tracking-tight">{meta.label}</span>
              <span className="rounded-full bg-ink/8 px-1.5 font-mono text-[10.5px] font-semibold text-inksoft">{deals.length}</span>
              <span className="ml-auto font-mono text-[10.5px] font-semibold text-inkfaint">{fmtBRLc(total)}</span>
            </div>
            <div className="flex-1 space-y-2.5 px-2.5 pb-3">
              {deals.map((d) => (
                <DealCard key={d.id} d={d} onDragStart={(e, id) => e.dataTransfer.setData("text/deal", id)} />
              ))}
              {deals.length === 0 && (
                <div className={cx("rounded-lg border border-dashed border-line px-3 py-6 text-center text-[11.5px] text-inkfaint transition", over === st && "border-moss-400 text-moss-700")}>
                  solte uma negociação aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NewDealModal() {
  const { state, dealModal, setDealModal, addDeal } = useStore();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(state.companies[0]?.id ?? "");
  const [value, setValue] = useState("120000");
  const [stage, setStage] = useState<Stage>("prospeccao");
  const [close, setClose] = useState("2026-10-30");
  const valid = name.trim().length > 2 && Number(value) > 0 && companyId;

  return (
    <Modal open={dealModal} onClose={() => setDealModal(false)} title="Nova negociação">
      <div className="space-y-3.5">
        <Field label="Nome">
          <input className={inputCls} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Piloto de dados — fase 1" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Empresa">
            <select className={inputCls} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {state.companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Valor (R$)">
            <input className={cx(inputCls, "font-mono")} type="number" min={0} step={1000} value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="Estágio inicial">
            <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              {STAGE_ORDER.filter((s) => s !== "ganho" && s !== "perdido").map((s) => (
                <option key={s} value={s}>{STAGES[s].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Fechamento previsto">
            <input className={inputCls} type="date" value={close} onChange={(e) => setClose(e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-3.5">
          <p className="font-mono text-[11px] text-inkfaint">o ledger registra edições humanas também</p>
          <div className="flex gap-2">
            <Btn kind="ghost" onClick={() => setDealModal(false)}>Cancelar</Btn>
            <Btn
              disabled={!valid}
              onClick={() => addDeal({ name: name.trim(), companyId, value: Number(value), stage, close })}
            >
              Criar negociação
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
