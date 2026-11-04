"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function PatientLiveSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const lastSearch = useRef(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [composing, setComposing] = useState(false);
  const [pending, startTransition] = useTransition();
  const search = useCallback((value: string) => {
    const trimmed = value.trim();
    if (lastSearch.current === trimmed) return;
    lastSearch.current = trimmed;
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    startTransition(() => router.replace(`/registration${params.size ? `?${params}` : ""}`, { scroll: false }));
  }, [router]);

  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, composing, search]);

  useEffect(() => {
    const sync = () => {
      const value = new URLSearchParams(window.location.search).get("q") || "";
      lastSearch.current = value;
      setQuery(value);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return <form className="patient-search" onSubmit={event => { event.preventDefault(); if (!composing) search(query); }} role="search">
    <label htmlFor="patient-search">ค้นหาผู้ป่วย</label>
    <div>
      <Search size={19} aria-hidden="true" />
      <input id="patient-search" name="q" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} placeholder="พิมพ์ชื่อ นามสกุล HN หรือเบอร์โทรศัพท์" onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} aria-describedby="patient-search-status" />
      {query && <button type="button" className="button button-secondary" onClick={() => { setQuery(""); search(""); }}>ล้างค้นหา</button>}
    </div>
    <p id="patient-search-status" className="form-note" role="status">{pending ? "กำลังค้นหา…" : "ค้นหาอัตโนมัติขณะพิมพ์"}</p>
  </form>;
}
