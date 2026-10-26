// docs/API.md 4번 요청 body, 6번 출력 스키마와 이름·구조를 똑같이 맞춘다.

export type Timeframe = "해커톤 24시간" | "1주" | "1달";

export type SpecInput = {
  title: string;
  problem: string;
  target: string;
  timeframe: Timeframe;
};

// GET /api/specs 목록 한 줄 (docs/API.md 4번). 전체 spec은 담지 않는다.
export type SpecListItem = {
  id: string;
  created_at: string;
  title: string;
  product_name: string;
  timeframe: string;
  one_liner: string | null;
};

export type Spec = {
  product_name: string;
  one_liner: string;
  problem: string;
  target_users: { persona: string; pain: string }[];
  core_features: {
    name: string;
    description: string;
    priority: "P0" | "P1";
  }[];
  user_flow: string[];
  screens: { name: string; purpose: string }[];
  data_model: { table: string; columns: string[] }[];
  api_endpoints: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    description: string;
  }[];
  out_of_scope: string[];
  risks: string[];
  first_prompt: string;
  // PRD 8-3 내 버전: 최종 사용자가 받는 결과물(리포트·화면) 샘플
  result_sample: {
    format: string;
    sections: { heading: string; example: string }[];
  };
};

// 화면·마크다운 변환용. 8-3 이전에 저장된 PRD에는 result_sample이 없을 수 있다.
export type StoredSpec = Omit<Spec, "result_sample"> & {
  result_sample?: Spec["result_sample"];
};
