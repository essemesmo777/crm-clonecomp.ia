import { useState } from "react";
import { useStore } from "../store";
import { Btn, Chip, Field, SectionLabel, Toggle, inputCls } from "../ui";

function SourceRow({
  title,
  desc,
  on,
  inputLabel,
  value,
  placeholder,
  onChange,
  onSave,
  env,
}: {
  title: string;
  desc: string;
  on: boolean;
  inputLabel?: string;
  value?: string;
  placeholder?: string;
  onChange?: (v: string) => void;
  onSave?: () => void;
  env?: string;
}) {
  return (
    <div className="card flex flex-col gap-3 p-4 transition hover:border-moss-300 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-[420px]">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${on ? "bg-moss-500" : "bg-ink/25"}`} />
          <p className="font-display text-[14px] font-bold">{title}</p>
          <Chip className={on ? "bg-moss-100 text-moss-700" : "bg-ink/8 text-inksoft"}>{on ? "on" : "off"}</Chip>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-inksoft">{desc}</p>
      </div>
      <div className="w-full sm:w-[300px]">
        {inputLabel && (
          <Field label={inputLabel}>
            <input
              className={`${inputCls} font-mono !text-[12px]`}
              type="password"
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSave?.()}
            />
          </Field>
        )}
        {env && <code className="mt-1 block font-mono text-[10.5px] text-inkfaint">{env}</code>}
        {onSave && (
          <Btn kind="dark" className="mt-2" onClick={onSave}>Salvar</Btn>
        )}
      </div>
    </div>
  );
}

export function Settings() {
  const { state, saveSettings, resetDemo } = useStore();
  const [web, setWeb] = useState(state.settings.webResearchKey);
  const [ctx, setCtx] = useState(state.settings.contextKey);
  const [bridge, setBridge] = useState(state.settings.bridgeSecret);

  return (
    <div className="mx-auto max-w-[860px] space-y-4 px-6 py-6">
      <div className="anim-rise rounded-xl border border-pine-700/60 bg-pine-900 p-4 font-mono text-[11.5px] leading-relaxed text-pine-100/75">
        <p className="mb-1 text-pine-100/45"># cada chave abre UM lugar a mais para olhar — sem nenhuma, o CRM funciona:</p>
        <p><span className="text-amber-500">off</span>  Web research <span className="text-pine-100/40">(PERPLEXITY_API_KEY)</span></p>
        <p><span className="text-limey">on </span>  Company brand data <span className="text-pine-100/40">(Settings → General)</span></p>
        <p><span className="text-limey">on </span>  LinkedIn <span className="text-pine-100/40">(Settings → General)</span></p>
        <p className="mt-1 text-pine-100/45"># o agente é avisado no início de cada sessão e planeja com o que existe</p>
      </div>

      <div className="stagger space-y-3">
        <SourceRow
          title="Web research"
          desc="Deixa o agente buscar na web aberta, com citações. Sem a chave, ele pula essa fonte e avisa — nenhuma chamada falha em silêncio."
          on={!!state.settings.webResearchKey}
          inputLabel="Chave da API"
          value={web}
          placeholder="pplx-…"
          env="PERPLEXITY_API_KEY"
          onChange={setWeb}
          onSave={() => saveSettings({ webResearchKey: web.trim() })}
        />
        <SourceRow
          title="Context — marca da empresa + LinkedIn"
          desc="Uma chave só para as duas coisas: o logotipo, o setor e o nome real por trás do domínio; e a leitura de um perfil LinkedIn que já esteja no registro."
          on={!!state.settings.contextKey}
          inputLabel="Chave Context"
          value={ctx}
          placeholder="ctx_live_…"
          env="mesma chave para as duas fontes"
          onChange={setCtx}
          onSave={() => saveSettings({ contextKey: ctx.trim() })}
        />
        <SourceRow
          title="Mailbox sync"
          desc="Lê (só lê) as threads, reuniões e blocos de assinatura do rep — de graça e é a melhor evidência que existe: nenhuma vendida chega perto de uma resposta do próprio endereço da pessoa."
          on={state.settings.mailboxSync}
        />
        <div className="card flex items-start justify-between gap-4 p-4">
          <div className="max-w-[420px]">
            <p className="font-display text-[14px] font-bold">Sincronizar caixa de entrada</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-inksoft">
              Encaminhamento único: a primeira checagem só marca a hora e não importa nada — conectar uma caixa antiga não despeja anos de e-mail no CRM.
            </p>
          </div>
          <Toggle on={state.settings.mailboxSync} onChange={(v) => saveSettings({ mailboxSync: v })} label="Mailbox sync" />
        </div>
        <SourceRow
          title="Ponte do agente (conversa)"
          desc="Libera a caixa de perguntas na aba Agente de cada registro. As conversas são duráveis e sobrevivem a reload; sem o segredo, a aba avisa e o agente segue a própria agenda."
          on={!!state.settings.bridgeSecret}
          inputLabel="Segredo da ponte"
          value={bridge}
          placeholder="mesmo valor nos dois processos"
          env="AGENT_BRIDGE_SECRET"
          onChange={setBridge}
          onSave={() => saveSettings({ bridgeSecret: bridge.trim() })}
        />
      </div>

      <div className="card p-4">
        <SectionLabel>As três regras do código</SectionLabel>
        <ul className="grid gap-2 text-[12.5px] leading-relaxed text-inksoft md:grid-cols-3">
          <li className="rounded-lg bg-ink/[0.035] p-3"><b className="text-ink">1.</b> Inteligência nunca vive na API — a API relata o que aconteceu; o agente decide o que significa.</li>
          <li className="rounded-lg bg-ink/[0.035] p-3"><b className="text-ink">2.</b> UI vem de um lugar só — sem sobrescrever estilo no call site.</li>
          <li className="rounded-lg bg-ink/[0.035] p-3"><b className="text-ink">3.</b> Não existem organizações — single tenant de propósito.</li>
        </ul>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-dashed border-clay-500/40 bg-clay-100/30 px-4 py-3">
        <p className="text-[12.5px] text-inksoft">Restaurar o pipeline de demonstração (idempotente, como o <code className="font-mono text-[11px]">db:seed</code>).</p>
        <Btn kind="danger" onClick={resetDemo}>Resetar dados demo</Btn>
      </div>
    </div>
  );
}
