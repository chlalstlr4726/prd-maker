import type { Spec } from "@/lib/types";

// 한 섹션 = 위 1px 선 + 왼쪽 라벨 / 오른쪽 본문 (768px 미만은 위아래로 쌓임)
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 border-t border-border py-6 md:grid-cols-[160px_1fr] md:gap-8">
      <h3 className="text-sm font-semibold text-muted">{label}</h3>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function PriorityBadge({ priority }: { priority: "P0" | "P1" }) {
  const color = priority === "P0" ? "bg-accent text-white" : "bg-border text-text";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {priority}
    </span>
  );
}

export default function SpecView({ spec }: { spec: Spec }) {
  return (
    <article className="rounded-[18px] border border-border bg-card px-6 pt-6">
      <header className="pb-6">
        <h2 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.374px]">
          {spec.product_name}
        </h2>
        <p className="mt-2 text-muted">{spec.one_liner}</p>
      </header>

      <Section label="문제">
        <p>{spec.problem}</p>
      </Section>

      <Section label="타깃 유저">
        <ul className="space-y-3">
          {spec.target_users.map((u, i) => (
            <li key={i}>
              <p className="font-semibold">{u.persona}</p>
              <p className="text-muted">{u.pain}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="핵심 기능">
        <ul className="space-y-3">
          {spec.core_features.map((f, i) => (
            <li key={i}>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={f.priority} />
                <span className="font-semibold">{f.name}</span>
              </div>
              <p className="mt-1 text-muted">{f.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="유저 플로우">
        <ol className="list-decimal space-y-1 pl-5">
          {spec.user_flow.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section label="화면">
        <ul className="space-y-2">
          {spec.screens.map((s, i) => (
            <li key={i}>
              <span className="font-semibold">{s.name}</span>
              <span className="text-muted"> · {s.purpose}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="데이터 모델 / API">
        <div className="space-y-4 font-mono text-sm">
          {spec.data_model.map((t, i) => (
            <div key={i}>
              <p className="font-semibold">{t.table}</p>
              <ul className="text-muted">
                {t.columns.map((c, j) => (
                  <li key={j}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
          <ul className="space-y-1">
            {spec.api_endpoints.map((a, i) => (
              <li key={i} className="break-words">
                <span className="font-semibold">{a.method}</span> {a.path}
                <span className="text-muted"> · {a.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section label="이번에 안 하는 것">
        <ul className="list-disc space-y-1 pl-5">
          {spec.out_of_scope.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section label="리스크">
        <ul className="list-disc space-y-1 pl-5">
          {spec.risks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Section>

      <Section label="첫 프롬프트">
        <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-bg p-4 font-mono text-sm">
          {spec.first_prompt}
        </pre>
      </Section>
    </article>
  );
}
