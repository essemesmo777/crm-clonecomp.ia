import { useEffect } from "react";
import { CRMProvider, useStore } from "./store";
import { Sidebar, Topbar } from "./shell";
import { Dashboard } from "./views/Dashboard";
import { Pipeline, NewDealModal } from "./views/Pipeline";
import { Companies, Contacts, RecordDrawer } from "./views/Records";
import { AgentConsole } from "./views/Agent";
import { Settings } from "./views/Settings";
import { Toasts } from "./ui";

const META = {
  dashboard: { title: "Visão geral", sub: "o ledger do que é verdade — e quem decidiu cada fato" },
  pipeline: { title: "Pipeline", sub: "arraste para mover; edições humanas também vão para o ledger" },
  companies: { title: "Empresas", sub: "dossiês que se preenchem sozinhos quando a evidência é forte" },
  contacts: { title: "Contatos", sub: "nada sobre uma pessoa é achado — evidência forte ou decisão humana" },
  agent: { title: "Agente", sub: "18 ferramentas · 4 skills · 1 schedule — fecha o navegador e ele continua" },
  settings: { title: "Ajustes", sub: "toda fonte externa é opcional; sem nenhuma, ainda funciona" },
} as const;

function Shell() {
  const { view, toasts } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const meta = META[view];

  return (
    <div className="relative flex h-full overflow-hidden">
      <div className="ambient" />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} subtitle={meta.sub} />
        <main key={view} className="anim-rise min-h-0 flex-1 overflow-y-auto scroll-thin">
          {view === "dashboard" && <Dashboard />}
          {view === "pipeline" && <Pipeline />}
          {view === "companies" && <Companies />}
          {view === "contacts" && <Contacts />}
          {view === "agent" && <AgentConsole />}
          {view === "settings" && <Settings />}
        </main>
      </div>
      <RecordDrawer />
      <NewDealModal />
      <Toasts list={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <CRMProvider>
      <Shell />
    </CRMProvider>
  );
}
