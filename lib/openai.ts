import "server-only";

import OpenAI from "openai";
import type { ProjectSettings } from "@/lib/presets";
import { buildInput, buildInstructions } from "@/lib/prompt";
import { isSpec, specSchema } from "@/lib/spec-schema";
import type { Spec, SpecInput } from "@/lib/types";

// 실패 종류. app/api/specs/route.ts가 이걸 보고 상태코드와 화면 문구를 고른다.
export type GenerateErrorKind =
  | "config" // 키 없음, 잘못된 키, 사용량 한도
  | "rate_limit" // 너무 많은 요청
  | "upstream" // OpenAI 연결 실패, 서버 오류, 실패 상태
  | "refused" // 모델이 거절 / 콘텐츠 필터
  | "truncated" // max_output_tokens에 걸려 잘림
  | "invalid_output"; // 빈 응답, JSON 아님, Spec 모양 아님

export class GenerateError extends Error {
  constructor(
    public kind: GenerateErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "GenerateError";
  }
}

// 지침은 lib/prompt.ts가 "공통 규칙 + 관점 프리셋 + 프로젝트 조건"으로 조합한다 (PRD 8-5)
export async function generateSpec(input: SpecInput, settings: ProjectSettings): Promise<Spec> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new GenerateError("config", "OPENAI_API_KEY is not set");
  }
  const model = process.env.OPENAI_MODEL || "gpt-6-luna";

  // 클라이언트는 함수 안에서 만든다 (키가 없어도 빌드는 통과하게)
  const client = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 1 });
  const startedAt = Date.now();

  let response: OpenAI.Responses.Response;
  try {
    response = await client.responses.create({
      model,
      instructions: buildInstructions(settings, input.timeframe),
      input: buildInput(input, settings),
      max_output_tokens: 16000,
      text: {
        format: { type: "json_schema", name: "prd", strict: true, schema: specSchema },
      },
    });
  } catch (err) {
    throw classifyApiError(err);
  }

  // 사용량 로그 (키와 사용자 입력 전문은 남기지 않는다)
  const usage = response.usage;
  console.info(
    `[openai] model=${model} preset=${settings.presetId} status=${response.status} ` +
      `input_tokens=${usage?.input_tokens ?? "-"} output_tokens=${usage?.output_tokens ?? "-"} ` +
      `total_tokens=${usage?.total_tokens ?? "-"} ms=${Date.now() - startedAt}`,
  );

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason;
    if (reason === "max_output_tokens") {
      throw new GenerateError("truncated", "response hit max_output_tokens");
    }
    if (reason === "content_filter") {
      throw new GenerateError("refused", "response stopped by content filter");
    }
    throw new GenerateError("upstream", `response incomplete: ${reason ?? "unknown"}`);
  }
  if (response.status !== "completed") {
    throw new GenerateError("upstream", `response status: ${response.status ?? "unknown"}`);
  }

  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((c) => c.type === "refusal"),
  );
  if (refused) {
    throw new GenerateError("refused", "model refused");
  }

  const text = response.output_text;
  if (!text) {
    throw new GenerateError("invalid_output", "empty output_text");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GenerateError("invalid_output", "output_text is not JSON");
  }
  if (!isSpec(parsed)) {
    throw new GenerateError("invalid_output", "output does not match Spec");
  }
  return parsed;
}

// OpenAI SDK 예외를 우리 실패 종류로 바꾼다
function classifyApiError(err: unknown): GenerateError {
  if (err instanceof OpenAI.APIConnectionError) {
    return new GenerateError("upstream", `connection error: ${err.message}`);
  }
  if (err instanceof OpenAI.APIError) {
    const detail = `status=${err.status} code=${err.code ?? "-"} request_id=${err.requestID ?? "-"}`;
    if (err.status === 401 || err.status === 403) {
      return new GenerateError("config", `auth error ${detail}`);
    }
    if (err.status === 429) {
      return err.code === "insufficient_quota"
        ? new GenerateError("config", `quota exceeded ${detail}`)
        : new GenerateError("rate_limit", `rate limited ${detail}`);
    }
    return new GenerateError("upstream", `api error ${detail}`);
  }
  return new GenerateError("upstream", err instanceof Error ? err.message : "unknown error");
}
