// docs/API.md 4번 요청 body, 6번 출력 스키마와 이름·구조를 똑같이 맞춘다.

export type Timeframe = "해커톤 24시간" | "1주" | "1달";

export type SpecInput = {
  title: string;
  problem: string;
  target: string;
  timeframe: Timeframe;
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
};
