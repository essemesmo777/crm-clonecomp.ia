export type Stage =
  | "prospeccao"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export interface Fact {
  id: string;
  text: string;
  source: string;
  strength: number; // 0..1
  ts: number;
  settled: "auto" | "human";
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employees: number | null;
  city: string;
  color: string;
  brief: string;
  website?: string;
  facts: Fact[];
}

export type IdentityStatus = "confirmed" | "suggestion" | "question" | "unknown";

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  title: string;
  email: string;
  linkedin?: string;
  identity: { status: IdentityStatus; score: number; source: string };
  facts: Fact[];
}

export interface Deal {
  id: string;
  name: string;
  companyId: string;
  contactId?: string;
  value: number;
  stage: Stage;
  close: string; // ISO date
  owner: string;
}

export type TaskKind =
  | "identify_contact"
  | "enrich_company"
  | "research_person"
  | "read_crm_history"
  | "web_research"
  | "recheck";

export type TaskStatus = "due" | "leased" | "done";

export interface QueueTask {
  id: string;
  kind: TaskKind;
  label: string;
  targetId: string;
  targetName: string;
  dueAt: number;
  status: TaskStatus;
}

export type EventType =
  | "lease"
  | "tool"
  | "fact"
  | "suggest"
  | "question"
  | "answer"
  | "recheck"
  | "budget"
  | "system"
  | "human"
  | "skip";

export interface AgentEvent {
  id: string;
  ts: number;
  type: EventType;
  text: string;
  tool?: string;
  cost?: number;
  targetId?: string;
  targetName?: string;
}

export interface Suggestion {
  id: string;
  text: string;
  targetId: string;
  targetName: string;
  source: string;
  strength: number;
  status: "pending" | "accepted" | "rejected";
}

export interface AgentQuestion {
  id: string;
  text: string;
  context: string;
  options: string[];
  targetId: string;
  targetName: string;
  source: string;
  status: "open" | "answered";
  answer?: string;
}

export interface Recheck {
  id: string;
  targetId: string;
  targetName: string;
  dueAt: number;
  reason: string;
  done: boolean;
}

export interface SettingsState {
  webResearchKey: string;
  contextKey: string;
  mailboxSync: boolean;
  bridgeSecret: string;
}

export interface CRMState {
  version: number;
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  tasks: QueueTask[];
  log: AgentEvent[];
  suggestions: Suggestion[];
  questions: AgentQuestion[];
  rechecks: Recheck[];
  settings: SettingsState;
  budget: { spent: number; total: number };
  running: boolean;
  bootedAt: number;
}

export type View =
  | "dashboard"
  | "pipeline"
  | "companies"
  | "contacts"
  | "agent"
  | "settings";

export type RecordKind = "company" | "contact" | "deal";

export interface OpenRecord {
  kind: RecordKind;
  id: string;
  tab: "resumo" | "agente";
}

export interface Toast {
  id: string;
  msg: string;
  tone: "ok" | "warn" | "info";
}

/* ------- engine ------- */

export type EngineAction =
  | { type: "tool"; tool: string; text: string; cost: number; targetId?: string; targetName?: string }
  | { type: "outcome-fact"; targetId: string; targetName: string; kind: "company" | "contact"; fact: string; source: string; strength: number }
  | { type: "outcome-suggestion"; targetId: string; targetName: string; text: string; source: string; strength: number }
  | { type: "outcome-question"; targetId: string; targetName: string; text: string; context: string; options: string[]; source: string }
  | { type: "outcome-recheck"; targetId: string; targetName: string; reason: string; inMin: number }
  | { type: "finish-task"; taskId: string; note: string };
