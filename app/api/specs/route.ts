import { GenerateError, generateSpec, type GenerateErrorKind } from "@/lib/openai";
import type { SpecInput, Timeframe } from "@/lib/types";

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

  try {
    const spec = await generateSpec(input);
    // Step 2: 저장 없이 결과만 돌려준다. Step 3에서 Supabase 저장을 붙인다.
    return Response.json({ spec }, { status: 201 });
  } catch (err) {
    if (err instanceof GenerateError) {
      console.error(`[api/specs] ${err.kind}: ${err.message}`);
      const { status, message } = ERROR_RESPONSES[err.kind];
      return errorResponse(status, message);
    }
    console.error("[api/specs] unexpected error", err);
    return errorResponse(500, "알 수 없는 오류가 났어요.");
  }
}
