import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "../../curriculum/types";
import { canonical, formatCategory, formatPeriod, plain, resolveReference, splitTracks } from "../shared/utils";

export function DependencyGraph({ courses, onOpen }: { courses: Course[]; onOpen: (course: Course) => void }) {
  const graphCourses = useMemo(
    () => courses.filter((course) => course.category !== "slot_optativa"),
    [courses],
  );
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ key: string; d: string; kind: "prerequisite" | "corequisite" }[]>([]);
  const focused = graphCourses.find((course) => course.code === focusedCode) ?? null;
  const relatedCodes = useMemo(() => {
    if (!focused) return null;
    const result = new Set([canonical(focused.code)]);
    (focused.prerequisites ?? []).forEach((item) => result.add(canonical(resolveReference(item, graphCourses))));
    (focused.corequisites ?? []).forEach((item) => result.add(canonical(resolveReference(item, graphCourses))));
    graphCourses.forEach((course) => {
      const references = [...(course.prerequisites ?? []), ...(course.corequisites ?? [])].map((item) => canonical(resolveReference(item, graphCourses)));
      if (references.includes(canonical(focused.code))) result.add(canonical(course.code));
    });
    return result;
  }, [focused, graphCourses]);
  const visibleCourses = useMemo(() => {
    const normalizedQuery = plain(query.trim());
    return graphCourses.filter((course) => relatedCodes?.has(canonical(course.code)) ?? (!normalizedQuery || plain(`${course.code ?? ""} ${(course.names ?? []).join(" ")} ${(course.mnemonics ?? []).join(" ")}`).includes(normalizedQuery))).sort((a, b) => (a.period ?? Number.MAX_SAFE_INTEGER) - (b.period ?? Number.MAX_SAFE_INTEGER) || (a.names?.[0] ?? "").localeCompare(b.names?.[0] ?? "", "pt-BR"));
  }, [graphCourses, query, relatedCodes]);
  const calculate = useCallback(() => {
    const container = containerRef.current;
    if (!container || !focused) { setPaths([]); return; }
    const bounds = container.getBoundingClientRect();
    const next: { key: string; d: string; kind: "prerequisite" | "corequisite" }[] = [];
    const connect = (sourceCode: string, targetCode: string, kind: "prerequisite" | "corequisite") => {
      const source = container.querySelector<HTMLElement>(`[data-graph-code="${CSS.escape(sourceCode)}"]`);
      const target = container.querySelector<HTMLElement>(`[data-graph-code="${CSS.escape(targetCode)}"]`);
      if (!source || !target) return;
      const a = source.getBoundingClientRect(); const b = target.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - bounds.left; const y1 = a.top + a.height / 2 - bounds.top;
      const x2 = b.left + b.width / 2 - bounds.left; const y2 = b.top + b.height / 2 - bounds.top;
      next.push({ key: `${kind}-${sourceCode}-${targetCode}`, kind, d: `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}` });
    };
    visibleCourses.forEach((target) => { (target.prerequisites ?? []).forEach((source) => connect(resolveReference(source, graphCourses), target.code ?? "", "prerequisite")); (target.corequisites ?? []).forEach((source) => connect(resolveReference(source, graphCourses), target.code ?? "", "corequisite")); });
    setPaths(next);
  }, [focused, graphCourses, visibleCourses]);
  useEffect(() => {
    const frame = requestAnimationFrame(calculate); const observer = new ResizeObserver(calculate);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", calculate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", calculate); };
  }, [calculate]);

  return <div className="graph-shell">
    <div className="graph-intro"><div><span className="section-kicker">GRAFO EXPLORÁVEL</span><h2>Dependências entre disciplinas</h2><p>Busque ou selecione uma disciplina para isolar sua vizinhança. Selecione-a novamente para ver os detalhes.</p></div><div className="graph-legend"><span><i /> Pré-requisito</span><span><i className="corequisite-dot" /> Co-requisito</span></div></div>
    <div className="graph-controls"><label className="graph-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg><input value={query} onChange={(event) => { setQuery(event.target.value); setFocusedCode(null); }} placeholder="Buscar no grafo..." /></label><span>{focused ? `${visibleCourses.length} disciplinas relacionadas` : `${visibleCourses.length} disciplinas`}</span>{focused && <button onClick={() => setFocusedCode(null)}>Ver todas</button>}</div>
    <div className="graph-canvas" ref={containerRef}>
      <svg className="graph-lines" aria-hidden="true"><defs><marker id="arrow-prerequisite" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>{paths.map((path) => <path key={path.key} className={path.kind} d={path.d} markerEnd={path.kind === "prerequisite" ? "url(#arrow-prerequisite)" : undefined} />)}</svg>
      {visibleCourses.map((course) => <button key={course.code} data-graph-code={course.code} className={`graph-node ${course.code === focusedCode ? "selected" : ""}`} onClick={() => course.code === focusedCode ? onOpen(course) : setFocusedCode(course.code ?? null)}><span>{course.code}</span><strong>{course.names?.[0] ?? "Disciplina sem nome"}</strong><small>{[course.period === undefined ? "" : formatPeriod(course.period), course.category ? formatCategory(course.category) : "", ...splitTracks(course.tracks)].filter(Boolean).join(" · ")}</small></button>)}
      {!visibleCourses.length && <p className="graph-empty">Nenhuma disciplina encontrada.</p>}
    </div>
  </div>;
}
