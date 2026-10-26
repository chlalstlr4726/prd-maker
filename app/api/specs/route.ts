import { connection } from "next/server";
import { GenerateError, generateSpec, type GenerateErrorKind } from "@/lib/openai";
import { getSupabase, SupabaseConfigError } from "@/lib/supabase";
import type { Spec, SpecInput, SpecListItem, Timeframe } from "@/lib/types";

const SAVE_FAILED_MESSAGE =
  "PRD는 만들었지만 저장하지 못했어요. 이 화면을 벗어나면 사라지니 필요하면 내용을 복사해 두세요.";

const TIMEFRAMES: Timeframe[] = ["해커톤 24시간", "1주", "1달"];

// 브라우저에는 이 고정 문구만 보낸다. 상세 원인은 서버 로그에만.
const ERROR_RESPONSES: Record<GenerateErrorKind, { status: number; message: string }> = {
  refused: { status: 422, message: "이 내용으로는 PRD를 만들 수 없어요. 입력을 바꿔 다시 시도해 주세요." },
  rate_limit: { status: 429, message: "요청이 많아요. 잠시 후 다시 시도해 주세요." },
  upstream: { status: 502, message: "AI 응답에 문제가 있었어요. 다시 시도해 주세요." },
  truncated: { status: 502, message: "AI 응답에 문제가 있었어요. 다시 시도해 주세요." },
  invalid_output: { status: 502, message: "AI 응답에 문제가 있었어요. 다시 시도해 주세요." },
  config: { status: 503, message: "서버 설정 문제로 지금은 PRD를 만들 수 없어요." },
};

function errorResponse(status: number, error: string) {
  return Response.json({ error }, { status });
}

// docs/API.md 4번 검증 규칙. 통과하면 SpecInput, 아니면 화면에 보여줄 메시지.
function validate(body: unknown): SpecInput | string {
  if (typeof body !== "object" || body === null) return "요청 형식이 올바르지 않아요.";
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const problem = typeof b.problem === "string" ? b.problem.trim() : "";
  if (!title) return "아이디어 이름을 입력해 주세요.";
  if (title.length > 100) return "아이디어 이름은 100자 이하로 적어 주세요.";
  if (!problem) return "해결하려는 문제를 입력해 주세요.";
  if (problem.length > 1000) return "문제는 1000자 이하로 적어 주세요.";

  const target = typeof b.target === "string" ? b.target.trim() : "";
  const timeframe = TIMEFRAMES.includes(b.timeframe as Timeframe)
    ? (b.timeframe as Timeframe)
    : "해커톤 24시간";

  return { title, problem, target, timeframe };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "요청 형식이 올바르지 않아요.");
  }

  const input = validate(body);
  if (typeof input === "string") {
    return errorResponse(400, input);
  }

  let spec: Spec;
  try {
    spec = await generateSpec(input);
  } catch (err) {
    if (err instanceof GenerateError) {
      console.error(`[api/specs] ${err.kind}: ${err.message}`);
      const { status, message } = ERROR_RESPONSES[err.kind];
      return errorResponse(status, message);
    }
    console.error("[api/specs] unexpected error", err);
    return errorResponse(500, "알 수 없는 오류가 났어요.");
  }

  // 저장은 딱 한 번만 시도한다. 실패해도 OpenAI를 다시 부르지 않고, 만든 PRD는 그대로 돌려준다.
  try {
    const { data, error } = await getSupabase()
      .from("specs")
      .insert({
        title: input.title,
        problem: input.problem,
        target: input.target || null,
        timeframe: input.timeframe,
        product_name: spec.product_name,
        spec,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return Response.json(
      { id: data.id, created_at: data.created_at, spec, saved: true },
      { status: 201 },
    );
  } catch (err) {
    logSupabaseError("insert", err);
    return Response.json(
      { id: null, created_at: null, spec, saved: false, error: SAVE_FAILED_MESSAGE },
      { status: 200 },
    );
  }
}

export async function GET() {
  // 빌드 때 미리 실행(프리렌더)하지 말고 요청이 올 때마다 DB를 읽게 한다
  await connection();

  try {
    const { data, error } = await getSupabase()
      .from("specs")
      .select("id, created_at, title, product_name, timeframe, one_liner:spec->>one_liner")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }) // 같은 시각이면 id로 순서 고정
      .limit(50);
    if (error) throw error;
    return Response.json({ items: data as SpecListItem[] });
  } catch (err) {
    logSupabaseError("select", err);
    if (err instanceof SupabaseConfigError) {
      return errorResponse(503, "서버 설정 문제로 지금은 목록을 불러올 수 없어요.");
    }
    return errorResponse(500, "목록을 불러오지 못했어요.");
  }
}

// Supabase 에러는 서버 로그에만 남긴다 (키·사용자 입력 원문은 남기지 않음)
function logSupabaseError(action: string, err: unknown) {
  if (err instanceof SupabaseConfigError) {
    console.error(`[api/specs] supabase ${action} config: ${err.message}`);
    return;
  }
  const e = err as { code?: string; message?: string };
  console.error(`[api/specs] supabase ${action} failed: code=${e?.code ?? "-"} message=${e?.message ?? "-"}`);
}
