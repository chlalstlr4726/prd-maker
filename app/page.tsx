"use client";

import { useRef, useState } from "react";
import SpecView from "@/components/SpecView";
import {
  CUSTOM_INSTRUCTIONS_MAX,
  DEFAULT_SETTINGS,
  GOALS,
  PRESET_OPTIONS,
  TEAM_SIZES,
  type ProjectSettings,
} from "@/lib/presets";
import type { Spec, SpecInput, Timeframe } from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["해커톤 24시간", "1주", "1달"];

export default function Home() {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [target, setTarget] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("해커톤 24시간");
  // 프로젝트 설정 (PRD 8-5). 서버로는 presetId만 보내고, 실제 지침은 서버가 고른다.
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const preset = PRESET_OPTIONS.find((p) => p.id === settings.presetId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [saveWarning, setSaveWarning] = useState("");
  // state는 다음 렌더 때 바뀌므로, 아주 빠른 연타는 ref로 한 번 더 막는다
  const inFlightRef = useRef(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || inFlightRef.current) return; // 중복 제출 방지

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
    inFlightRef.current = true;
    try {
      const res = await fetch("/api/specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          settings: { ...settings, customInstructions: settings.customInstructions.trim() },
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.spec) {
        setSpec(data.spec);
        // 생성은 됐지만 저장에 실패한 경우: 카드는 그대로 보여주고 경고만 띄운다
        setSaveWarning(data.saved === false ? (data.error ?? "저장하지 못했어요.") : "");
      } else {
        setError(data?.error ?? "PRD를 만들지 못했어요. 다시 시도해 주세요.");
      }
    } catch {
      setError("서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.");
    } finally {
      // 성공이든 실패든 버튼을 다시 풀어서 바로 재시도할 수 있게 한다
      setLoading(false);
      inFlightRef.current = false;
    }
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

            <fieldset className="space-y-4 border-t border-border pt-6">
              <legend className="text-sm font-semibold">
                프로젝트 설정 <span className="font-normal text-muted">(선택)</span>
              </legend>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">관점</span>
                <select
                  className={inputClass}
                  value={settings.presetId}
                  onChange={(e) =>
                    setSettings({ ...settings, presetId: e.target.value as ProjectSettings["presetId"] })
                  }
                >
                  {PRESET_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {preset && <p className="text-sm text-muted">{preset.description}</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">목표</span>
                  <select
                    className={inputClass}
                    value={settings.goal}
                    onChange={(e) =>
                      setSettings({ ...settings, goal: e.target.value as ProjectSettings["goal"] })
                    }
                  >
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold">팀 규모</span>
                  <select
                    className={inputClass}
                    value={settings.teamSize}
                    onChange={(e) =>
                      setSettings({ ...settings, teamSize: e.target.value as ProjectSettings["teamSize"] })
                    }
                  >
                    {TEAM_SIZES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">
                  추가 지침{" "}
                  <span className="font-normal text-muted">
                    ({settings.customInstructions.length}/{CUSTOM_INSTRUCTIONS_MAX})
                  </span>
                </span>
                <textarea
                  className="w-full rounded-[18px] border border-border bg-bg px-5 py-[11px] outline-none focus:border-accent"
                  rows={2}
                  value={settings.customInstructions}
                  onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
                  placeholder="예: Supabase를 쓰고 싶다. 로그인은 빼 줘. 결과 화면을 특히 자세히."
                  maxLength={CUSTOM_INSTRUCTIONS_MAX}
                />
              </label>
            </fieldset>

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
              {loading ? "PRD 작성 중..." : "PRD 만들기"}
            </button>
          </form>
        </div>
      </section>

      {spec && (
        <section className="space-y-3">
          {saveWarning && (
            <p className="rounded-[18px] border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
              {saveWarning}
            </p>
          )}
          <SpecView spec={spec} />
        </section>
      )}
    </main>
  );
}
