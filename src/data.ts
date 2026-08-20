import type {
  AgentEvent,
  AgentQuestion,
  Company,
  Contact,
  CRMState,
  Deal,
  EngineAction,
  QueueTask,
  Recheck,
  Stage,
  Suggestion,
} from "./types";

export const STAGES: Record<
  Stage,
  { label: string; prob: number; dot: string; chip: string }
> = {
  prospeccao: { label: "Prospecção", prob: 0.1, dot: "bg-sky-500", chip: "bg-sky-100 text-sky-700" },
  qualificacao: { label: "Qualificação", prob: 0.25, dot: "bg-pine-600", chip: "bg-pine-100 text-pine-700" },
  proposta: { label: "Proposta", prob: 0.5, dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700" },
  negociacao: { label: "Negociação", prob: 0.75, dot: "bg-moss-500", chip: "bg-moss-100 text-moss-700" },
  ganho: { label: "Ganho", prob: 1, dot: "bg-moss-400", chip: "bg-moss-100 text-moss-700" },
  perdido: { label: "Perdido", prob: 0, dot: "bg-clay-500", chip: "bg-clay-100 text-clay-700" },
};

export const STAGE_ORDER: Stage[] = [
  "prospeccao",
  "qualificacao",
  "proposta",
  "negociacao",
  "ganho",
  "perdido",
];

const m = (min: number) => Date.now() - min * 60_000;
const inMin = (min: number) => Date.now() + min * 60_000;

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const F = (id: string, text: string, source: string, strength: number, ts: number) => ({
  id,
  text,
  source,
  strength,
  ts,
  settled: "auto" as const,
});

const companies: Company[] = [
  {
    id: "c1",
    name: "Nuvem Logistics",
    domain: "nuvemlog.com.br",
    industry: "Logística",
    employees: 320,
    city: "Recife, PE",
    color: "#1F7A53",
    brief: "Operadora de torre de controle para varejo. Fechou o MVP da torre em 2025 e negocia a expansão para o Nordeste.",
    website: "https://nuvemlog.com.br",
    facts: [
      F("f1", "O comitê de orçamento fecha às sextas — propostas precisam entrar até quarta.", "crm.read-history", 0.86, m(2600)),
      F("f2", "Usa TMS próprio escrito em Delphi; migração é objeção recorrente.", "crm.read-history", 0.78, m(4100)),
    ],
  },
  {
    id: "c2",
    name: "Banco Mandacaru",
    domain: "mandacaru.bank",
    industry: "Fintech",
    employees: 1400,
    city: "São Paulo, SP",
    color: "#8A5A12",
    brief: "Banco digital focado no agro. Compliance exigente: todo fornecedor passa por due diligence de 6 semanas.",
    website: "https://mandacaru.bank",
    facts: [
      F("f3", "Due diligence de fornecedores leva 6 semanas — começar antes da proposta formal.", "crm.read-history", 0.81, m(3300)),
    ],
  },
  {
    id: "c3",
    name: "Vetor Energia",
    domain: "vetorenergia.com.br",
    industry: "Energia",
    employees: 580,
    city: "Belo Horizonte, MG",
    color: "#3D7EB0",
    brief: "Comercializadora e geradora solar. SCADA legado de 2014; projeto de migração em qualificação.",
    facts: [
      F("f4", "SCADA atual é de 2014, contrato de suporte vence em março.", "crm.signature-block", 0.9, m(5200)),
    ],
  },
  {
    id: "c4",
    name: "Kairós Saúde",
    domain: "kairossaude.com.br",
    industry: "Saúde",
    employees: 240,
    city: "Curitiba, PR",
    color: "#C05237",
    brief: "Rede de telemedicina. Contrato atual renova em setembro; COO é a patrocinadora do projeto.",
    facts: [],
  },
  {
    id: "c5",
    name: "Studio Arpoador",
    domain: "arpoador.studio",
    industry: "Agência",
    employees: 45,
    city: "Rio de Janeiro, RJ",
    color: "#2F4A3C",
    brief: "Estúdio de design e produto. Ticket menor, ciclo curto — entrou pelo site na segunda.",
    facts: [],
  },
  {
    id: "c6",
    name: "Ferrovia Norte S.A.",
    domain: "fnorte.com.br",
    industry: "Infraestrutura",
    employees: null,
    city: "Belém, PA",
    color: "#B3402A",
    brief: "Chegou como um domínio cinza com iniciais — o agente ainda está montando o dossiê.",
    facts: [],
  },
];

const contacts: Contact[] = [
  {
    id: "p1",
    companyId: "c1",
    name: "Marina Duarte",
    title: "Head de Operações",
    email: "marina.duarte@nuvemlog.com.br",
    linkedin: "linkedin.com/in/marinaduarte-ops",
    identity: { status: "confirmed", score: 0.94, source: "crm.signature-block" },
    facts: [F("f5", "Responde sempre antes das 9h — horário ótimo para follow-up.", "crm.read-history", 0.72, m(1900))],
  },
  {
    id: "p2",
    companyId: "c1",
    name: "Caio Ferreira",
    title: "CTO",
    email: "caio@nuvemlog.com.br",
    identity: { status: "confirmed", score: 0.88, source: "github.account-identity" },
    facts: [],
  },
  {
    id: "p3",
    companyId: "c2",
    name: "Letícia Mota",
    title: "Diretora de Risco",
    email: "leticia.mota@mandacaru.bank",
    linkedin: "linkedin.com/in/leticiamota",
    identity: { status: "confirmed", score: 0.91, source: "linkedin.identity" },
    facts: [],
  },
  {
    id: "p4",
    companyId: "c2",
    name: "Rafael Antunes",
    title: "Gerente de Inovação",
    email: "rafael.antunes@mandacaru.bank",
    identity: { status: "suggestion", score: 0.48, source: "github.account-identity" },
    facts: [],
  },
  {
    id: "p5",
    companyId: "c3",
    name: "Sofia Brandt",
    title: "Head de Expansão",
    email: "sofia.brandt@vetorenergia.com.br",
    linkedin: "linkedin.com/in/sofiabrandt",
    identity: { status: "confirmed", score: 0.89, source: "linkedin.identity" },
    facts: [],
  },
  {
    id: "p6",
    companyId: "c3",
    name: "Igor Salles",
    title: "CFO",
    email: "igor.salles@vetorenergia.com.br",
    identity: { status: "confirmed", score: 0.85, source: "crm.signature-block" },
    facts: [],
  },
  {
    id: "p7",
    companyId: "c4",
    name: "Beatriz Nunes",
    title: "COO",
    email: "beatriz@kairossaude.com.br",
    identity: { status: "confirmed", score: 0.93, source: "crm.signature-block" },
    facts: [],
  },
  {
    id: "p8",
    companyId: "c5",
    name: "Tom Ribeiro",
    title: "Product Lead",
    email: "tom@arpoador.studio",
    identity: { status: "question", score: 0.41, source: "linkedin.identity" },
    facts: [],
  },
  {
    id: "p9",
    companyId: "c6",
    name: "Helena Prado",
    title: "CEO",
    email: "helena.prado@fnorte.com.br",
    identity: { status: "unknown", score: 0.22, source: "—" },
    facts: [],
  },
  {
    id: "p10",
    companyId: "c6",
    name: "Davi Castro",
    title: "Suprimentos",
    email: "davi.castro@fnorte.com.br",
    identity: { status: "unknown", score: 0.19, source: "—" },
    facts: [],
  },
];

const deals: Deal[] = [
  { id: "d1", name: "Torre de controle — expansão Nordeste", companyId: "c1", contactId: "p1", value: 480_000, stage: "negociacao", close: "2026-09-18", owner: "você" },
  { id: "d2", name: "Piloto de conciliação PIX", companyId: "c2", contactId: "p3", value: 260_000, stage: "proposta", close: "2026-10-02", owner: "você" },
  { id: "d3", name: "Migração SCADA", companyId: "c3", contactId: "p5", value: 720_000, stage: "qualificacao", close: "2026-11-15", owner: "você" },
  { id: "d4", name: "Telemedicina — fase 2", companyId: "c4", contactId: "p7", value: 180_000, stage: "proposta", close: "2026-09-30", owner: "você" },
  { id: "d5", name: "Rebranding do portal", companyId: "c5", contactId: "p8", value: 90_000, stage: "prospeccao", close: "2026-09-10", owner: "você" },
  { id: "d6", name: "Painel de malha ferroviária", companyId: "c6", contactId: "p9", value: 1_100_000, stage: "prospeccao", close: "2026-12-05", owner: "você" },
  { id: "d7", name: "Torre de controle — MVP", companyId: "c1", contactId: "p1", value: 310_000, stage: "ganho", close: "2026-06-20", owner: "você" },
  { id: "d8", name: "Chat interno Mandacaru", companyId: "c2", contactId: "p4", value: 60_000, stage: "perdido", close: "2026-05-12", owner: "você" },
];

const tasks: QueueTask[] = [
  { id: "t1", kind: "identify_contact", label: "Confirmar identidade de Rafael Antunes", targetId: "p4", targetName: "Rafael Antunes", dueAt: inMin(1), status: "due" },
  { id: "t2", kind: "enrich_company", label: "Enriquecer dossiê de Ferrovia Norte", targetId: "c6", targetName: "Ferrovia Norte S.A.", dueAt: inMin(3), status: "due" },
  { id: "t3", kind: "research_person", label: "Pesquisar histórico de Sofia Brandt", targetId: "p5", targetName: "Sofia Brandt", dueAt: inMin(6), status: "due" },
  { id: "t4", kind: "read_crm_history", label: "Reler thread da Kairós Saúde", targetId: "c4", targetName: "Kairós Saúde", dueAt: inMin(9), status: "due" },
  { id: "t5", kind: "web_research", label: "Pesquisar notícias da Nuvem Logistics", targetId: "c1", targetName: "Nuvem Logistics", dueAt: inMin(12), status: "due" },
];

const suggestions: Suggestion[] = [
  {
    id: "s1",
    text: "Rafael Antunes também assina como r.antunes@mandacaru.bank em threads antigas — unificar os dois endereços no registro.",
    targetId: "p4",
    targetName: "Rafael Antunes",
    source: "github.account-identity",
    strength: 0.48,
    status: "pending",
  },
  {
    id: "s2",
    text: "Vetor Energia mudou a marca para “Vetor Renovável” no site institucional — atualizar o nome exibido do registro.",
    targetId: "c3",
    targetName: "Vetor Energia",
    source: "company-brand-data",
    strength: 0.61,
    status: "pending",
  },
  {
    id: "s3",
    text: "Kairós abriu 12 vagas de engenharia clínica em 30 dias — sinal de expansão; vale antecipar a conversa da fase 2.",
    targetId: "c4",
    targetName: "Kairós Saúde",
    source: "web-research",
    strength: 0.55,
    status: "pending",
  },
];

const questions: AgentQuestion[] = [
  {
    id: "q1",
    text: "Duas identidades possíveis para tom@arpoador.studio — qual é a pessoa certa?",
    context: "O LinkedIn devolveu dois “Tom Ribeiro” ligados ao domínio: um Product Lead no studio e um freelancer com site próprio em arpoador.dev. Nenhum tem bloco de assinatura no histórico.",
    options: [
      "Tom Ribeiro — Product Lead (arpoador.studio)",
      "T. Ribeiro — freelancer (arpoador.dev)",
      "Nenhum: deixar o campo em branco",
    ],
    targetId: "p8",
    targetName: "Tom Ribeiro",
    source: "linkedin.identity",
    status: "open",
  },
];

const rechecks: Recheck[] = [
  { id: "r1", targetId: "c1", targetName: "Nuvem Logistics", dueAt: inMin(60 * 26), reason: "Comitê de orçamento fecha sexta — voltar com a proposta revisada antes de quarta.", done: false },
  { id: "r2", targetId: "c2", targetName: "Banco Mandacaru", dueAt: inMin(60 * 50), reason: "Compliance pediu o SOC 2 por e-mail — reler a thread para ver se já anexamos.", done: false },
];

const log: AgentEvent[] = [
  { id: "e01", ts: m(46), type: "system", text: "[agent] off  Web research (PERPLEXITY_API_KEY)" },
  { id: "e02", ts: m(46), type: "system", text: "[agent] on   Company brand data (Settings → General)" },
  { id: "e03", ts: m(46), type: "system", text: "[agent] on   LinkedIn (Settings → General)" },
  { id: "e04", ts: m(46), type: "system", text: "[agent] on   Mailbox sync — você@suainstalação.com" },
  { id: "e05", ts: m(41), type: "lease", text: "dispatch: aluguei “Confirmar identidade de Helena Prado” (lease 120 s)", targetId: "p9", targetName: "Helena Prado" },
  { id: "e06", ts: m(40), type: "tool", tool: "read_crm_history", cost: 6, text: "214 threads de fnorte.com.br — nenhuma assinatura do remetente", targetId: "p9", targetName: "Helena Prado" },
  { id: "e07", ts: m(39), type: "skip", text: "web_search pulado: fonte opcional desligada (PERPLEXITY_API_KEY ausente)", targetId: "p9", targetName: "Helena Prado" },
  { id: "e08", ts: m(38), type: "system", text: "evidência fraca demais para escrever no registro — vira sugestão", targetId: "p9", targetName: "Helena Prado" },
  { id: "e09", ts: m(37), type: "fact", text: "Gravado: “Due diligence de fornecedores leva 6 semanas” (força 81%)", tool: "record_fact", targetId: "c2", targetName: "Banco Mandacaru" },
  { id: "e10", ts: m(33), type: "recheck", text: "schedule_recheck: voltar à Nuvem em 26 h — “comitê de orçamento fecha sexta”", tool: "schedule_recheck", targetId: "c1", targetName: "Nuvem Logistics" },
  { id: "e11", ts: m(21), type: "tool", tool: "crm.signature-block", cost: 4, text: "bloco de assinatura da Beatriz confirma cargo de COO", targetId: "p7", targetName: "Beatriz Nunes" },
  { id: "e12", ts: m(12), type: "suggest", text: "Sugestão pendente: Kairós abriu 12 vagas de engenharia clínica", targetId: "c4", targetName: "Kairós Saúde" },
  { id: "e13", ts: m(5), type: "question", text: "Pergunta aberta ao rep: quem é tom@arpoador.studio?", targetId: "p8", targetName: "Tom Ribeiro" },
  { id: "e14", ts: m(2), type: "system", text: "fila: 5 tarefas vencendo nos próximos 12 min — esperando o lease" },
];

export const SEED: CRMState = {
  version: 3,
  companies,
  contacts,
  deals,
  tasks,
  log,
  suggestions,
  questions,
  rechecks,
  settings: { webResearchKey: "", contextKey: "ctx_live_9f3kd2", mailboxSync: true, bridgeSecret: "" },
  budget: { spent: 74, total: 240 },
  running: true,
  bootedAt: m(46),
};

/* ---------------- missões roteirizadas do agente ---------------- */

export const AUTHORED: Record<string, EngineAction[]> = {
  t1: [
    { type: "tool", tool: "read_crm_history", cost: 6, text: "releio 38 threads de mandacaru.bank — 2 blocos de assinatura divergentes", targetId: "p4", targetName: "Rafael Antunes" },
    { type: "tool", tool: "github.account-identity", cost: 5, text: "r.antunes casa com perfil que cita dois empregadores (2019–2022)", targetId: "p4", targetName: "Rafael Antunes" },
    { type: "tool", tool: "search_crm", cost: 3, text: "busco “r.antunes” no histórico local — 6 mensagens antigas, mesmo tom de escrita", targetId: "p4", targetName: "Rafael Antunes" },
    { type: "outcome-suggestion", targetId: "p4", targetName: "Rafael Antunes", text: "Unificar r.antunes@mandacaru.bank como alias de Rafael Antunes — evidência circunstancial, não escrevo sozinho.", source: "github.account-identity", strength: 0.52 },
    { type: "finish-task", taskId: "t1", note: "identidade segue como sugestão — um humano decide" },
  ],
  t2: [
    { type: "tool", tool: "company-brand-data", cost: 4, text: "domínio cinza ganha rosto: razão social “Ferrovia Norte S.A.”, setor Malhas ferroviárias", targetId: "c6", targetName: "Ferrovia Norte S.A." },
    { type: "tool", tool: "enrich_company", cost: 8, text: "1.240 km de malha no corredor Norte–Sul; terminal principal em Barcarena", targetId: "c6", targetName: "Ferrovia Norte S.A." },
    { type: "tool", tool: "web_search", cost: 10, text: "edital FN-2026-118: contratação de centro de controle por R$ 4,2 mi", targetId: "c6", targetName: "Ferrovia Norte S.A." },
    { type: "outcome-fact", targetId: "c6", targetName: "Ferrovia Norte S.A.", kind: "company", fact: "Opera 1.240 km de malha no corredor Norte–Sul; terminal principal em Barcarena (PA).", source: "company-brand-data", strength: 0.88 },
    { type: "outcome-recheck", targetId: "c6", targetName: "Ferrovia Norte S.A.", reason: "Edital FN-2026-118 fecha no fim do mês — voltar com o dossiê pronto antes disso.", inMin: 60 * 72 },
    { type: "finish-task", taskId: "t2", note: "dossiê da Ferrovia Norte deixou de ser um quadrado cinza" },
  ],
  t3: [
    { type: "tool", tool: "linkedin.identity", cost: 7, text: "carreira lida do perfil: Enel → Votorantim → Vetor (2019–hoje)", targetId: "p5", targetName: "Sofia Brandt" },
    { type: "tool", tool: "read_crm_history", cost: 6, text: "na call de 12/03 ela diz que orçamento de expansão passa pelo CFO", targetId: "p5", targetName: "Sofia Brandt" },
    { type: "outcome-fact", targetId: "p5", targetName: "Sofia Brandt", kind: "contact", fact: "Foi Head de Novos Negócios na Enel (2019–2023) antes da Votorantim.", source: "linkedin.identity", strength: 0.91 },
    { type: "outcome-suggestion", targetId: "p5", targetName: "Sofia Brandt", text: "Decisão de compra da Vetor passa pelo CFO Igor Salles — endereçar a proposta do SCADA aos dois.", source: "crm.read-history", strength: 0.66 },
    { type: "finish-task", taskId: "t3", note: "2 fatos novos: 1 gravado, 1 sugerido" },
  ],
  t4: [
    { type: "tool", tool: "read_crm_history", cost: 6, text: "3 mensagens de beatriz@ nos últimos 30 dias; a última cobra o roadmap", targetId: "c4", targetName: "Kairós Saúde" },
    { type: "tool", tool: "crm.signature-block", cost: 4, text: "bloco de assinatura do contrato: vigência até 30/09, renovação automática", targetId: "c4", targetName: "Kairós Saúde" },
    { type: "outcome-fact", targetId: "c4", targetName: "Kairós Saúde", kind: "company", fact: "Contrato vigente renova automaticamente em 30/09 — janela de renegociação abre em agosto.", source: "crm.signature-block", strength: 0.84 },
    { type: "outcome-recheck", targetId: "c4", targetName: "Kairós Saúde", reason: "Voltar 14 dias antes da janela de renovação com o rascunho da fase 2 pronto.", inMin: 60 * 24 * 14 },
    { type: "finish-task", taskId: "t4", note: "renovação da Kairós agora tem data no registro" },
  ],
  t5: [
    { type: "tool", tool: "web_search", cost: 10, text: "Nuvem Logistics capta R$ 80 mi em série C liderada por fundo de infraestrutura", targetId: "c1", targetName: "Nuvem Logistics" },
    { type: "outcome-suggestion", targetId: "c1", targetName: "Nuvem Logistics", text: "Com a série C, a expansão Nordeste deve acelerar — vale antecipar o aditivo da torre de controle.", source: "web-research", strength: 0.58 },
    { type: "finish-task", taskId: "t5", note: "sinal de mercado registrado como sugestão" },
  ],
};

/* -------- depois das missões autorais, o agente segue com genéricas -------- */

const GENERIC_FACTS: Record<string, string[]> = {
  c1: ["Frota própria de 214 caminhões; 60% dedicada ao varejo alimentar.", "SLA contratado de 99,5% na torre de controle; multa de 2% por ponto abaixo."],
  c2: ["Comitê de tecnologia reúne-se às terças — decisões de ferramenta saem dali.", "Padrão interno exige SSO via Azure AD em todo fornecedor SaaS."],
  c3: ["Usina de Janaúba responde por 43% da geração própria.", "Contrato de O&M atual tem gatilho de renegociação por disponibilidade."],
  c4: ["NPS da telemedicina em 71; reclamações concentram-se no agendamento.", "Plano de abrir 300 leitos virtuais até o fim do ano."],
  c5: ["Time de 45 pessoas; 12 designers — decisão de compra é do sócio-fundador.", "Perderam o pitch de um banco grande em 2025 por falta de case em dados."],
  c6: ["Transporta 18 mi t/ano de grãos; gargalo declarado é o pátio de Barcarena.", "Diretoria de digitalização criada em janeiro — orçamento próprio."],
};

export const AMBIENT_POOL = [
  "dispatch: 0 linhas vencidas — lease ocioso, sessão segue durável",
  "heartbeat: checkpoint gravado · a sessão sobrevive a redeploy",
  "mailbox sync: nenhuma mensagem nova desde a última varredura",
  "skill evidence.md v3 recarregada — precificação de evidência atualizada",
  "sandbox: grep em 214 threads · nenhum dado de cliente saiu do workspace",
  "ledger: 0 conflitos de identidade detectados na última hora",
];

export const KIND_LABEL: Record<string, string> = {
  identify_contact: "identify_contact",
  enrich_company: "enrich_company",
  research_person: "research_person",
  read_crm_history: "read_crm_history",
  web_research: "web_research",
  recheck: "recheck",
};
