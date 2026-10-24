"use client";

import { useEffect, useRef, useState } from "react";
import SpecView from "@/components/SpecView";
import type { Spec, SpecInput, Timeframe } from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["해커톤 24시간", "1주", "1달"];

// Step 1 전용 가짜 데이터. 입력값은 그대로 옮기고, 입력에 없는 칸은 "[예시]"로만 채운다.
// Step 2에서 이 함수를 지우고 fetch("/api/specs")로 바꾼다.
function makeMockSpec(input: SpecInput): Spec {
  return {
    product_name: input.title,
    one_liner: `${input.title} (미리보기)`,
    problem: input.problem,
    target_users: [
      {
        persona: input.target || "타깃 미입력",
        pain: "[예시] 실제 생성 시 AI가 이 타깃의 불편함을 적어요.",
      },
    ],
    core_features: [
      { name: "[예시] 핵심 기능 1", description: "실제 생성 시 AI가 채워요.", priority: "P0" },
      { name: "[예시] 추가 기능 1", description: "실제 생성 시 AI가 채워요.", priority: "P1" },
    ],
    user_flow: ["[예시] 1단계", "[예시] 2단계", "[예시] 3단계"],
    screens: [{ name: "[예시] 메인", purpose: "실제 생성 시 AI가 채워요." }],
    data_model: [{ table: "[예시] table_name", columns: ["id uuid", "created_at timestamptz"] }],
    api_endpoints: [{ method: "GET", path: "/api/example", description: "[예시]" }],
    out_of_scope: [`개발 기간(${input.timeframe}) 안에 못 끝낼 기능은 [예시]로 여기에 적혀요.`],
    risks: ["[예시] 실제 생성 시 AI가 리스크를 적어요."],
    first_prompt: `아이디어: ${input.title}\n문제: ${input.problem}\n타깃: ${input.target || "미입력"}\n개발 기간: ${input.timeframe}\n\n[예시] 실제 생성 시 AI가 바로 쓸 수 있는 첫 프롬프트를 적어요.`,
  };
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [target, setTarget] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("해커톤 24시간");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spec, setSpec] = useState<Spec | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화면을 떠나면 남아 있는 타이머를 정리한다
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // 중복 제출 방지

    const input: SpecInput = {
      title: title.trim(),
      problem: problem.trim(),
      target: target.trim(),
      timeframe,
    };
    if (!input.title || !input.problem) {
      setError("아이디어 이름과 문제를 입력해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setSpec(makeMockSpec(input));
      setLoading(false);
      timerRef.current = null;
    }, 1000);
  }

  const inputClass =
    "w-full rounded-full border border-border bg-bg px-5 py-[11px] outline-none focus:border-accent";

  return (
    <main className="mx-auto w-full max-w-[1088px] px-4 pb-20">
      <section className="grid gap-8 py-12 md:grid-cols-[1fr_minmax(0,672px)] md:py-20">
        <div>
          <h1 className="break-keep text-[34px] font-semibold leading-[1.07] tracking-[-0.28px] md:text-[56px]">
            PRD 메이커
          </h1>
        </div>

        <div className="min-w-0">
          <p className="text-muted">
            아이디어를 적으면 기능 우선순위, 화면, 데이터 모델, 첫 프롬프트까지 정리된 PRD를 만들어요.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">아이디어 이름</span>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 해커톤 팀원 매칭 서비스"
                maxLength={100}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">해결하려는 문제</span>
              <textarea
                className="w-full rounded-[18px] border border-border bg-bg px-5 py-[11px] outline-none focus:border-accent"
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="예: 해커톤 직전에 팀을 못 구해서 혼자 나가거나 포기한다"
                maxLength={1000}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">
                타깃 유저 <span className="font-normal text-muted">(선택)</span>
              </span>
              <input
                className={inputClass}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="예: 해커톤 처음 나가는 대학생"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">개발 기간</span>
              <select
                className={inputClass}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              >
                {TIMEFRAMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <p className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent px-[22px] py-[11px] text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "PRD 미리보기 생성 중..." : "PRD 만들기"}
            </button>
          </form>
        </div>
      </section>

      {spec && (
        <section className="space-y-3">
          <p className="text-sm text-muted">
            미리보기용 가짜 데이터예요. 실제 생성은 Step 2부터예요.
          </p>
          <SpecView spec={spec} />
        </section>
      )}
    </main>
  );
}
