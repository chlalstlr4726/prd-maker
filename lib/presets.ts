// PRD 8-5 프로젝트 설정. 브라우저(폼 선택지)와 서버(검증)가 같이 쓴다.
// 여기에는 id·이름·설명만 둔다. 실제 AI 지침 원문은 서버 전용 lib/prompt.ts에만 있다.

export const PRESET_OPTIONS = [
  { id: "default", label: "기본 PM", description: "해커톤 여러 번 우승한 시니어 PM 겸 테크리드. 어떤 주제든." },
  {
    id: "fashion-beauty",
    label: "패션·뷰티 PM",
    description: "스타일 산업을 알고 구현까지 따지는 PM. 미란다처럼 단호하게.",
  },
] as const;

export const GOALS = [
  { id: "prototype", label: "프로토타입" },
  { id: "mvp", label: "MVP" },
  { id: "production", label: "실제 서비스" },
] as const;

export const TEAM_SIZES = [
  { id: "solo", label: "1인" },
  { id: "small", label: "2~3명" },
  { id: "team", label: "4명 이상" },
] as const;

export type PresetId = (typeof PRESET_OPTIONS)[number]["id"];
export type ProjectGoal = (typeof GOALS)[number]["id"];
export type TeamSize = (typeof TEAM_SIZES)[number]["id"];

export type ProjectSettings = {
  presetId: PresetId;
  goal: ProjectGoal;
  teamSize: TeamSize;
  customInstructions: string;
};

export const DEFAULT_SETTINGS: ProjectSettings = {
  presetId: "default",
  goal: "mvp",
  teamSize: "solo",
  customInstructions: "",
};

export const CUSTOM_INSTRUCTIONS_MAX = 1000;

const PRESET_IDS: readonly string[] = PRESET_OPTIONS.map((p) => p.id);
const GOAL_IDS: readonly string[] = GOALS.map((g) => g.id);
const TEAM_SIZE_IDS: readonly string[] = TEAM_SIZES.map((t) => t.id);

type Raw = Record<string, unknown>;

// 기본값 채우기: settings가 없거나(undefined/null) 필드가 생략된 경우에만 기본값을 쓴다.
// 값이 허용 목록에 맞는지는 validateSettings가 먼저 확인한다.
export function applyDefaults(raw: unknown): ProjectSettings {
  const r: Raw = typeof raw === "object" && raw !== null ? (raw as Raw) : {};
  return {
    presetId: (r.presetId ?? DEFAULT_SETTINGS.presetId) as PresetId,
    goal: (r.goal ?? DEFAULT_SETTINGS.goal) as ProjectGoal,
    teamSize: (r.teamSize ?? DEFAULT_SETTINGS.teamSize) as TeamSize,
    customInstructions:
      typeof r.customInstructions === "string" ? r.customInstructions.trim() : DEFAULT_SETTINGS.customInstructions,
  };
}

// 유효성 검사: 명시한 값이 허용 목록 밖이거나 타입이 틀리면 에러. 조용히 기본값으로 바꾸지 않는다.
export function validateSettings(
  raw: unknown,
): { ok: true; settings: ProjectSettings } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, settings: applyDefaults(raw) };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "프로젝트 설정 형식이 올바르지 않아요." };
  }
  const r = raw as Raw;

  const checks: [unknown, readonly string[], string][] = [
    [r.presetId, PRESET_IDS, "관점 프리셋"],
    [r.goal, GOAL_IDS, "프로젝트 목표"],
    [r.teamSize, TEAM_SIZE_IDS, "팀 규모"],
  ];
  for (const [value, allowed, name] of checks) {
    if (value === undefined || value === null) continue; // 생략 → 기본값
    if (typeof value !== "string" || !allowed.includes(value)) {
      return { ok: false, error: `${name} 값이 올바르지 않아요.` };
    }
  }

  const custom = r.customInstructions;
  if (custom !== undefined && custom !== null) {
    if (typeof custom !== "string") {
      return { ok: false, error: "추가 지침 형식이 올바르지 않아요." };
    }
    if (custom.trim().length > CUSTOM_INSTRUCTIONS_MAX) {
      return { ok: false, error: `추가 지침은 ${CUSTOM_INSTRUCTIONS_MAX}자 이하로 적어 주세요.` };
    }
  }

  return { ok: true, settings: applyDefaults(r) };
}
