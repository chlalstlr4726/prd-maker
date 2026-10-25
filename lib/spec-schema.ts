import type { Spec } from "@/lib/types";

// docs/API.md 6번 Spec 구조를 그대로 옮긴 JSON Schema (strict 규칙).
// 개수 제한(4~6개 등)은 여기 넣지 않고 lib/openai.ts의 instructions로 지시한다.

const str = { type: "string" } as const;
const strArray = { type: "array", items: str } as const;

function obj(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

export const specSchema = obj({
  product_name: str,
  one_liner: str,
  problem: str,
  target_users: { type: "array", items: obj({ persona: str, pain: str }) },
  core_features: {
    type: "array",
    items: obj({
      name: str,
      description: str,
      priority: { type: "string", enum: ["P0", "P1"] },
    }),
  },
  user_flow: strArray,
  screens: { type: "array", items: obj({ name: str, purpose: str }) },
  data_model: { type: "array", items: obj({ table: str, columns: strArray }) },
  api_endpoints: {
    type: "array",
    items: obj({
      method: { type: "string", enum: ["GET", "POST", "PATCH", "DELETE"] },
      path: str,
      description: str,
    }),
  },
  out_of_scope: strArray,
  risks: strArray,
  first_prompt: str,
});

// AI가 준 JSON이 정말 Spec 모양인지 실행 중에 한 번 더 확인한다 (외부 패키지 없이).

type Rec = Record<string, unknown>;

function isRec(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isStrArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isStr);
}

function isArrayOf(v: unknown, check: (item: Rec) => boolean): boolean {
  return Array.isArray(v) && v.every((item) => isRec(item) && check(item));
}

export function isSpec(v: unknown): v is Spec {
  if (!isRec(v)) return false;
  return (
    isStr(v.product_name) &&
    isStr(v.one_liner) &&
    isStr(v.problem) &&
    isArrayOf(v.target_users, (u) => isStr(u.persona) && isStr(u.pain)) &&
    isArrayOf(
      v.core_features,
      (f) =>
        isStr(f.name) &&
        isStr(f.description) &&
        (f.priority === "P0" || f.priority === "P1"),
    ) &&
    isStrArray(v.user_flow) &&
    isArrayOf(v.screens, (s) => isStr(s.name) && isStr(s.purpose)) &&
    isArrayOf(v.data_model, (t) => isStr(t.table) && isStrArray(t.columns)) &&
    isArrayOf(
      v.api_endpoints,
      (a) =>
        ["GET", "POST", "PATCH", "DELETE"].includes(a.method as string) &&
        isStr(a.path) &&
        isStr(a.description),
    ) &&
    isStrArray(v.out_of_scope) &&
    isStrArray(v.risks) &&
    isStr(v.first_prompt)
  );
}
