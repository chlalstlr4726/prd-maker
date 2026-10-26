import type { StoredSpec } from "@/lib/types";

// PRD를 마크다운 글로 바꾼다 (docs/API.md 2번: 브라우저/서버 공용).
// AI가 준 문자열에 줄바꿈·백틱·특수문자가 있어도 문서 구조(제목, 목록, 코드블록)가 깨지지 않게 처리한다.

const NO_SAMPLE_MESSAGE = "이 PRD는 결과물 샘플 기능 이전에 만들어져 샘플이 없어요.";

// 줄바꿈·탭을 공백 하나로 합친다 (제목, 목록 한 줄용)
function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// 본문 글이 마크다운 문법(제목, 목록, 인용, 표, HTML, 인라인 코드)으로 해석되지 않게 이스케이프한다
function escapeText(s: string): string {
  return s
    .split("\n")
    .map((line) =>
      line
        .trimStart() // 앞 공백 4칸이 코드블록이 되는 것 방지
        .replace(/\\/g, "\\\\")
        .replace(/[`<]/g, (c) => `\\${c}`)
        .replace(/^([#>+*|-]|=+$)/, "\\$1") // 줄 맨 앞 블록 기호
        .replace(/^(\d+)([.)])/, "$1\\$2"), // "1." 같은 번호 목록
    )
    .join("\n");
}

function inline(s: string): string {
  return escapeText(oneLine(s));
}

// 내용 안의 가장 긴 백틱 연속보다 1개 더 긴 펜스로 감싼다 (최소 3개)
function codeBlock(s: string): string {
  const longest = Math.max(0, ...(s.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}\n${s.replace(/\n+$/, "")}\n${fence}`;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${inline(item)}`).join("\n");
}

export function specToMarkdown(spec: StoredSpec): string {
  const blocks: string[] = [];

  blocks.push(`# ${inline(spec.product_name) || "PRD"}`);
  blocks.push(
    spec.one_liner
      .split("\n")
      .map((line) => `> ${escapeText(line)}`)
      .join("\n"),
  );

  blocks.push("## 문제", escapeText(spec.problem));

  blocks.push(
    "## 타깃 유저",
    spec.target_users.map((u) => `- **${inline(u.persona)}**: ${inline(u.pain)}`).join("\n"),
  );

  blocks.push(
    "## 핵심 기능",
    spec.core_features
      .map((f) => `- **[${f.priority}] ${inline(f.name)}**: ${inline(f.description)}`)
      .join("\n"),
  );

  blocks.push(
    "## 유저 플로우",
    spec.user_flow.map((step, i) => `${i + 1}. ${inline(step)}`).join("\n"),
  );

  blocks.push(
    "## 화면",
    spec.screens.map((s) => `- **${inline(s.name)}**: ${inline(s.purpose)}`).join("\n"),
  );

  // 8-3 이전에 저장된 PRD는 result_sample이 없을 수 있다
  blocks.push("## 결과물 샘플");
  const sample = spec.result_sample;
  if (sample && Array.isArray(sample.sections)) {
    blocks.push(`형식: ${inline(sample.format)}`);
    for (const section of sample.sections) {
      blocks.push(`### ${inline(section.heading)}`, escapeText(section.example));
    }
  } else {
    blocks.push(NO_SAMPLE_MESSAGE);
  }

  blocks.push(
    "## 데이터 모델",
    codeBlock(spec.data_model.map((t) => [t.table, ...t.columns.map((c) => `  ${c}`)].join("\n")).join("\n\n")),
  );

  blocks.push(
    "## API",
    spec.api_endpoints
      .map((a) => `- \`${a.method} ${oneLine(a.path).replace(/`/g, "'")}\`: ${inline(a.description)}`)
      .join("\n"),
  );

  blocks.push("## 이번에 안 하는 것", bullets(spec.out_of_scope));
  blocks.push("## 리스크", bullets(spec.risks));
  blocks.push("## 첫 프롬프트", codeBlock(spec.first_prompt));

  return blocks.join("\n\n") + "\n";
}

// 다운로드 파일 이름: 파일명에 못 쓰는 문자를 정리하고 60자로 자른다
export function toFileName(name: string): string {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 60)
    .trim();
  return `${cleaned || "prd"}.md`;
}
