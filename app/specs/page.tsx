"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SpecListItem } from "@/lib/types";

// 목록 카드 한 장. 상세 페이지(/specs/[id], P1)가 생기면 이 컴포넌트를 <Link>로 감싸기만 하면 된다.
// 지금은 갈 곳이 없으니 클릭되는 것처럼 보이지 않게 hover·커서·화살표를 넣지 않는다.
function SpecListCard({ item }: { item: SpecListItem }) {
  const date = new Date(item.created_at).toLocaleDateString("ko-KR");
  return (
    <article className="rounded-[18px] border border-border bg-card p-6">
      <p className="text-sm text-muted">
        {item.timeframe} · {date}
      </p>
      <h2 className="mt-1 break-words font-semibold">{item.product_name}</h2>
      {item.one_liner && <p className="mt-1 break-words text-muted">{item.one_liner}</p>}
    </article>
  );
}

export default function SpecsPage() {
  const [items, setItems] = useState<SpecListItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false; // 화면을 떠난 뒤 도착한 응답은 무시
    fetch("/api/specs")
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (ignore) return;
        if (res.ok && Array.isArray(data?.items)) {
          setItems(data.items);
        } else {
          setError(data?.error ?? "목록을 불러오지 못했어요.");
        }
      })
      .catch(() => {
        if (!ignore) setError("서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1088px] px-4 pb-20">
      <section className="grid gap-8 py-12 md:grid-cols-[1fr_minmax(0,672px)] md:py-20">
        <div>
          <h1 className="break-keep text-[34px] font-semibold leading-[1.07] tracking-[-0.28px] md:text-[56px]">
            내 PRD 목록
          </h1>
        </div>

        <div className="min-w-0">
          {error ? (
            <p className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : items === null ? (
            <p className="text-muted">불러오는 중...</p>
          ) : items.length === 0 ? (
            <div className="space-y-3">
              <p>아직 만든 PRD가 없다.</p>
              <Link href="/" className="text-accent">
                PRD 만들러 가기
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id}>
                  <SpecListCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
