import "server-only";

import { createClient } from "@supabase/supabase-js";

// 주의: 로컬 개발 전용 구조다.
// 이 앱에는 로그인이 없어서, 서버가 secret 키(RLS를 우회하는 관리자 키)로 누구의 요청이든 specs 테이블에 쓰고 읽는다.
// 외부에 공개 배포하려면 먼저 인증과 접근 제어(로그인, RLS 정책, 사용자별 row 제한)를 붙여야 한다.
// secret 키는 이 파일에서만 읽고, 브라우저 코드("use client")로 절대 보내지 않는다.

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

// 클라이언트는 함수 안에서 만든다 (환경변수가 없어도 빌드는 통과하게)
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    const missing = [!url && "SUPABASE_URL", !secretKey && "SUPABASE_SECRET_KEY"].filter(Boolean);
    throw new SupabaseConfigError(`missing env: ${missing.join(", ")}`);
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
