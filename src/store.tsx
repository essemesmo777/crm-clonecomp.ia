import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AgentEvent,
  CRMState,
  Deal,
  EngineAction,
  OpenRecord,
  SettingsState,
  Stage,
  Toast,
  View,
} from "./types";
import {
  AMBIENT_POOL,
  AUTHORED,
  SEED,
  STAGES,
  uid,
} from "./data";

const KEY = "compai-crm-v3";

/* ---------------- helpers ---------------- */

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
export const fmtBRL = (v: number) => brl.format(v);
export const fmtBRLc = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`
    : v >= 1_000
      ? `R$ ${Math.round(v / 1_000)} mil`
      : brl.format(v);

export const timeAgo = (ts: number) => {
  const d = Date.now() - ts;
  const min = Math.floor(d / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
};

export const timeUntil = (ts: number) => {
  const d = ts - Date.now();
  if (d <= 0) return "vencido";
  const min = Math.ceil(d / 60_000);
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `em ${h} h ${min % 60 ? `${min % 60} min` : ""}`.trim();
  return `em ${Math.floor(h / 24)} d ${h % 24 ? `${h % 24} h` : ""}`.trim();
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const clone = (s: CRMState): CRMState => JSON.parse(JSON.stringify(s)) as CRMState;

function load(): CRMState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CRMState;
      if (parsed.version === SEED.version) return parsed;
    }
  } catch {
    /* seed */
  }
  return clone(SEED);
}

/* ---------------- motor do agente ---------------- */

interface Meta {
  ambient: number;
  gen: number;
}

const GENERIC_FACTS: Record<string, string[]> = {
  c1: [
    "Frota própria de 214 caminhões; 60% dedicada ao varejo alimentar.",
    "SLA contratado de 99,5% na torre de controle; multa de 2% por ponto abaixo.",
  ],
  c2: [
    "Comitê de tecnologia reúne-se às terças — decisões de ferramenta saem dali.",
    "Padrão interno exige SSO via Azure AD em todo fornecedor SaaS.",
  ],
  c3: [
    "Usina de Janaúba responde por 43% da geração própria.",
    "Contrato de O&M atual tem gatilho de renegociação por disponibilidade.",
  ],
  c4: [
    "NPS da telemedicina em 71; reclamações concentram-se no agendamento.",
    "Plano de abrir 300 leitos virtuais até o fim do ano.",
  ],
  c5: [
    "Decisão de compra é do sócio-fundador; ciclo típico de 3 semanas.",
    "Perderam um pitch de banco em 2025 por falta de case em dados.",
  ],
  c6: [
    "Transporta 18 mi t/ano de grãos; gargalo declarado é o pátio de Barcarena.",
    "Diretoria de digitalização criada em janeiro, com orçamento próprio.",
  ],
};

function genericMission(s: CRMState, taskId: string, targetId: string, targetName: string): EngineAction[] {
  const t = s.tasks.find((x) => x.id === taskId);
  const company = s.companies.find((c) => c.id === targetId)
    ?? s.companies.find((c) => c.id === s.contacts.find((p) => p.id === targetId)?.companyId);
  const cid = company?.id ?? "c1";
  const pool = GENERIC_FACTS[cid] ?? [];
  const existing = new Set((company?.facts ?? []).map((f) => f.text));
  const next = pool.find((f) => !existing.has(f));
  const acts: EngineAction[] = [
    {
      type: "tool",
      tool: t?.kind === "identify_contact" ? "identify_contact" : "read_crm_history",
      cost: 5,
      text: `releio o histórico de ${targetName} desde a última varredura — nada mudou de endereço`,
      targetId,
      targetName,
    },
    {
      type: "tool",
      tool: "crm.signature-block",
      cost: 4,
      text: "cruzo blocos de assinatura com o ledger — sem conflito de identidade",
      targetId,
      targetName,
    },
  ];
  if (next && company) {
    acts.push({
      type: "outcome-fact",
      targetId: company.id,
      targetName: company.name,
      kind: "company",
      fact: next,
      source: "crm.read-history",
      strength: 0.79,
    });
  } else {
    acts.push({
      type: "outcome-recheck",
      targetId,
      targetName,
      reason: "Sem novidade forte — rotina de manter o dossiê quente.",
      inMin: 45,
    });
  }
  acts.push({ type: "finish-task", taskId, note: "varredura de rotina concluída sem conflitos" });
  return acts;
}

const NEW_TASK_POOL: Array<{ kind: CRMState["tasks"][number]["kind"]; label: (n: string) => string }> = [
  { kind: "read_crm_history", label: (n) => `Reler thread de ${n}` },
  { kind: "identify_contact", label: (n) => `Cruzar identidades em ${n}` },
  { kind: "enrich_company", label: (n) => `Revisar campos vazios de ${n}` },
  { kind: "research_person", label: (n) => `Atualizar dossiê de contato em ${n}` },
];

function stepEngine(prev: CRMState, run: EngineAction[], meta: Meta): CRMState {
  const s = clone(prev);
  const now = Date.now();
  const ev = (e: Omit<AgentEvent, "id" | "ts">) =>
    s.log.push({ id: uid(), ts: now, ...e });

  if (run.length === 0) {
    if (s.budget.spent >= s.budget.total) {
      if (s.running) {
        ev({ type: "budget", text: "orçamento de pesquisa esgotado — o agente para sozinho, como mandam as regras" });
        s.running = false;
      }
      return s;
    }
    const due = s.tasks
      .filter((t) => t.status === "due" && t.dueAt <= now)
      .sort((a, b) => a.dueAt - b.dueAt)[0];
    if (due) {
      due.status = "leased";
      ev({
        type: "lease",
        text: `dispatch: aluguei “${due.label}” — FOR UPDATE SKIP LOCKED, lease 120 s`,
        targetId: due.targetId,
        targetName: due.targetName,
      });
      run.push(...(AUTHORED[due.id] ?? genericMission(s, due.id, due.targetId, due.targetName)));
      return s;
    }
    const rc = s.rechecks.filter((r) => !r.done && r.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)[0];
    if (rc) {
      rc.done = true;
      ev({
        type: "recheck",
        text: `recheck venceu: ${rc.targetName} — “${rc.reason}”`,
        targetId: rc.targetId,
        targetName: rc.targetName,
      });
      run.push(
        {
          type: "tool",
          tool: "read_crm_history",
          cost: 5,
          text: `voltei a ${rc.targetName} pelo motivo que eu mesmo agendei`,
          targetId: rc.targetId,
          targetName: rc.targetName,
        },
        {
          type: "outcome-recheck",
          targetId: rc.targetId,
          targetName: rc.targetName,
          reason: "Ainda não houve resposta — manter o acompanhamento curto.",
          inMin: 90,
        },
      );
      return s;
    }
    // ambiente: fila vazia — mantém o app vivo e cria trabalho novo de tempos em tempos
    if (meta.ambient % 4 === 3 && s.tasks.filter((t) => t.status === "due").length < 4) {
      const c = s.companies[meta.gen % s.companies.length];
      const tpl = NEW_TASK_POOL[meta.gen % NEW_TASK_POOL.length];
      const t = {
        id: uid(),
        kind: tpl.kind,
        label: tpl.label(c.name),
        targetId: c.id,
        targetName: c.name,
        dueAt: now + (meta.gen % 2 === 0 ? 70_000 : 140_000),
        status: "due" as const,
      };
      s.tasks.push(t);
      ev({ type: "system", text: `agenda própria: criei a tarefa “${t.label}” para daqui a pouco`, targetId: t.targetId, targetName: t.targetName });
    } else {
      ev({ type: "system", text: AMBIENT_POOL[meta.ambient % AMBIENT_POOL.length] });
    }
    meta.ambient++;
    meta.gen++;
    return s;
  }

  const a = run.shift()!;
  switch (a.type) {
    case "tool": {
      if (a.tool === "web_search" && !s.settings.webResearchKey) {
        ev({ type: "skip", text: "web_search pulado: fonte opcional desligada (PERPLEXITY_API_KEY ausente)", targetId: a.targetId, targetName: a.targetName });
        break;
      }
      s.budget.spent = Math.min(s.budget.total, s.budget.spent + a.cost);
      ev({ type: "tool", tool: a.tool, cost: a.cost, text: a.text, targetId: a.targetId, targetName: a.targetName });
      break;
    }
    case "outcome-fact": {
      const fact = { id: uid(), text: a.fact, source: a.source, strength: a.strength, ts: now, settled: "auto" as const };
      if (a.strength >= 0.7) {
        if (a.kind === "company") {
          const c = s.companies.find((x) => x.id === a.targetId);
          c?.facts.unshift(fact);
        } else {
          const p = s.contacts.find((x) => x.id === a.targetId);
          p?.facts.unshift(fact);
        }
        ev({ type: "fact", text: `gravado no registro: “${a.fact}” (força ${Math.round(a.strength * 100)}%)`, tool: "record_fact", targetId: a.targetId, targetName: a.targetName });
      } else {
        s.suggestions.unshift({ id: uid(), text: a.fact, targetId: a.targetId, targetName: a.targetName, source: a.source, strength: a.strength, status: "pending" });
        ev({ type: "suggest", text: `evidência fraca (${Math.round(a.strength * 100)}%) — virou sugestão para um humano decidir`, targetId: a.targetId, targetName: a.targetName });
      }
      break;
    }
    case "outcome-suggestion":
      s.suggestions.unshift({ id: uid(), text: a.text, targetId: a.targetId, targetName: a.targetName, source: a.source, strength: a.strength, status: "pending" });
      ev({ type: "suggest", text: `sugestão pendente: “${a.text.split("—")[0].trim()}…”`, targetId: a.targetId, targetName: a.targetName });
      break;
    case "outcome-question":
      s.questions.unshift({ id: uid(), text: a.text, context: a.context, options: a.options, targetId: a.targetId, targetName: a.targetName, source: a.source, status: "open" });
      ev({ type: "question", text: "não consegui decidir sozinho — pergunta aberta ao rep", targetId: a.targetId, targetName: a.targetName });
      break;
    case "outcome-recheck": {
      s.rechecks.unshift({ id: uid(), targetId: a.targetId, targetName: a.targetName, dueAt: now + a.inMin * 60_000, reason: a.reason, done: false });
      const h = Math.round(a.inMin / 60);
      ev({ type: "recheck", tool: "schedule_recheck", text: `schedule_recheck: voltar a ${a.targetName} em ${h >= 24 ? `${Math.round(h / 24)} d` : `${h} h`} — “${a.reason}”`, targetId: a.targetId, targetName: a.targetName });
      break;
    }
    case "finish-task": {
      const t = s.tasks.find((x) => x.id === a.taskId);
      if (t) t.status = "done";
      ev({ type: "system", text: `✓ ${a.note}` });
      break;
    }
  }
  return s;
}

/* ---------------- contexto ---------------- */

interface StoreApi {
  state: CRMState;
  toasts: Toast[];
  toast: (msg: string, tone?: Toast["tone"]) => void;
  view: View;
  setView: (v: View) => void;
  record: OpenRecord | null;
  openRecord: (r: OpenRecord | null) => void;
  dealModal: boolean;
  setDealModal: (b: boolean) => void;
  moveDeal: (id: string, stage: Stage) => void;
  addDeal: (d: { name: string; companyId: string; value: number; stage: Stage; close: string }) => void;
  approveSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  answerQuestion: (id: string, option: string, index: number) => void;
  askRecord: (targetId: string, targetName: string, question: string) => void;
  toggleRun: () => void;
  refillBudget: () => void;
  saveSettings: (patch: Partial<SettingsState>) => void;
  resetDemo: () => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("store fora do provider");
  return v;
}

export function CRMProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CRMState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [record, setRecord] = useState<OpenRecord | null>(null);
  const [dealModal, setDealModal] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const runRef = useRef<EngineAction[]>([]);
  const metaRef = useRef<Meta>({ ambient: 0, gen: 0 });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state]);

  const toast = useCallback((msg: string, tone: Toast["tone"] = "ok") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    if (!state.running) return;
    const t = setInterval(() => {
      const next = stepEngine(stateRef.current, runRef.current, metaRef.current);
      setState(next);
    }, 2500);
    return () => clearInterval(t);
  }, [state.running]);

  const pushLog = (s: CRMState, e: Omit<AgentEvent, "id" | "ts">): CRMState => {
    const n = clone(s);
    n.log.push({ id: uid(), ts: Date.now(), ...e });
    return n;
  };

  const api: StoreApi = {
    state,
    toasts,
    toast,
    view,
    setView,
    record,
    openRecord: setRecord,
    dealModal,
    setDealModal,

    moveDeal: (id, stage) => {
      setState((s) => {
        const n = clone(s);
        const d = n.deals.find((x) => x.id === id);
        if (!d) return s;
        d.stage = stage;
        n.log.push({
          id: uid(),
          ts: Date.now(),
          type: "human",
          text: `${d.name} movida para “${STAGES[stage].label}” por um humano — edições manuais também vão para o ledger`,
          targetId: d.companyId,
        });
        return n;
      });
      toast(`Negociação movida para ${STAGES[stage].label}`);
    },

    addDeal: (d) => {
      const deal: Deal = { id: uid(), owner: "você", ...d };
      setState((s) => {
        const n = clone(s);
        n.deals.unshift(deal);
        n.log.push({
          id: uid(),
          ts: Date.now(),
          type: "human",
          text: `nova negociação criada por humano: “${deal.name}” (${fmtBRL(deal.value)})`,
          targetId: deal.companyId,
        });
        return n;
      });
      setDealModal(false);
      toast("Negociação criada — o agente já pode pesquisá-la");
    },

    approveSuggestion: (id) => {
      setState((s) => {
        const n = clone(s);
        const sg = n.suggestions.find((x) => x.id === id);
        if (!sg) return s;
        sg.status = "accepted";
        const fact = { id: uid(), text: sg.text, source: sg.source, strength: sg.strength, ts: Date.now(), settled: "human" as const };
        const c = n.companies.find((x) => x.id === sg.targetId);
        const p = n.contacts.find((x) => x.id === sg.targetId);
        if (c) c.facts.unshift(fact);
        if (p) {
          p.facts.unshift(fact);
          p.identity = { status: "confirmed", score: Math.max(p.identity.score, 0.8), source: "human.settled" };
        }
        n.log.push({ id: uid(), ts: Date.now(), type: "answer", text: `sugestão aceita pelo rep e gravada com selo humano: “${sg.text.slice(0, 72)}…”`, targetId: sg.targetId, targetName: sg.targetName });
        return n;
      });
      toast("Sugestão aceita — escrita no registro com selo humano");
    },

    rejectSuggestion: (id) => {
      setState((s) => {
        const n = clone(s);
        const sg = n.suggestions.find((x) => x.id === id);
        if (!sg) return s;
        sg.status = "rejected";
        n.log.push({ id: uid(), ts: Date.now(), type: "answer", text: `sugestão rejeitada pelo rep — o campo continua vazio (antes vazio que errado)`, targetId: sg.targetId, targetName: sg.targetName });
        return n;
      });
      toast("Sugestão rejeitada — o campo continua em branco", "info");
    },

    answerQuestion: (id, option, index) => {
      setState((s) => {
        const n = clone(s);
        const q = n.questions.find((x) => x.id === id);
        if (!q) return s;
        q.status = "answered";
        q.answer = option;
        const p = n.contacts.find((x) => x.id === q.targetId);
        if (p) {
          if (index === q.options.length - 1) {
            p.identity = { status: "unknown", score: 0.15, source: "human.settled" };
          } else {
            p.identity = { status: "confirmed", score: 0.9, source: "human.settled" };
          }
        }
        n.log.push({ id: uid(), ts: Date.now(), type: "answer", text: `rep respondeu: “${option}” — identidade liquidada`, targetId: q.targetId, targetName: q.targetName });
        return n;
      });
      toast("Resposta gravada — a identidade foi liquidada");
    },

    askRecord: (targetId, targetName, question) => {
      setState((s) =>
        pushLog(s, { type: "question", text: `você perguntou ao registro: “${question}”`, targetId, targetName })
      );
      setTimeout(() => {
        setState((s) => {
          const facts = [
            ...s.companies.find((c) => c.id === targetId)?.facts.map((f) => ({ ...f, who: "empresa" })) ?? [],
            ...s.contacts.find((p) => p.id === targetId)?.facts.map((f) => ({ ...f, who: "contato" })) ?? [],
          ].sort((a, b) => b.ts - a.ts);
          const f = facts[0];
          const answer = f
            ? `Pelo ledger, o fato mais recente é: “${f.text}” — fonte ${f.source}, força ${Math.round(f.strength * 100)}%, selo ${f.settled === "human" ? "humano" : "do agente"}. Nada além disso passa da minha régua de evidência.`
            : "Ainda não tenho evidência forte o bastante sobre isso — um campo em branco é melhor que um fato confiante e errado. Posso agendar um recheck se quiser.";
          return pushLog(s, { type: "answer", text: answer, targetId, targetName });
        });
      }, 1700);
    },

    toggleRun: () => {
      setState((s) => {
        const n = clone(s);
        n.running = !n.running;
        n.log.push({
          id: uid(),
          ts: Date.now(),
          type: "system",
          text: n.running
            ? "agente retomado pelo operador — sessão durável restaurada do checkpoint"
            : "agente pausado pelo operador — o lease expira e as tarefas voltam à fila",
        });
        return n;
      });
      toast(stateRef.current.running ? "Agente pausado" : "Agente retomado", "info");
    },

    refillBudget: () => {
      setState((s) => {
        const n = clone(s);
        n.budget.spent = 0;
        n.running = true;
        n.log.push({ id: uid(), ts: Date.now(), type: "budget", text: "orçamento de pesquisa recarregado pelo operador — 240 créditos, contador zerado" });
        return n;
      });
      toast("Orçamento recarregado — o agente voltou a rodar");
    },

    saveSettings: (patch) => {
      setState((s) => {
        const n = clone(s);
        n.settings = { ...n.settings, ...patch };
        const st = n.settings;
        n.log.push({ id: uid(), ts: Date.now(), type: "system", text: `[agent] ${st.webResearchKey ? "on " : "off"}  Web research (PERPLEXITY_API_KEY)` });
        n.log.push({ id: uid(), ts: Date.now(), type: "system", text: `[agent] ${st.contextKey ? "on " : "off"}  Company brand data (Settings → General)` });
        n.log.push({ id: uid(), ts: Date.now(), type: "system", text: `[agent] ${st.contextKey ? "on " : "off"}  LinkedIn (Settings → General)` });
        n.log.push({ id: uid(), ts: Date.now(), type: "system", text: `[agent] ${st.mailboxSync ? "on " : "off"}  Mailbox sync` });
        return n;
      });
      toast("Ajustes salvos — o agente replaneja em cima do que existe");
    },

    resetDemo: () => {
      localStorage.removeItem(KEY);
      runRef.current = [];
      setState(clone(SEED));
      toast("Dados de demonstração restaurados", "info");
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
