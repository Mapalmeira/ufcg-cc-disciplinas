import { useEffect } from "react";
import type { Course } from "../curriculum/types";
import { canonical, formatCategory, formatPeriod, resolveReference, splitTracks } from "./utils";

export function DetailModal({ course, courses, releases, onClose, onOpen }: {
  course: Course;
  courses: Course[];
  releases: Course[];
  onClose: () => void;
  onOpen: (course: Course) => void;
}) {
  const courseFor = (reference: string) => courses.find((item) => canonical(item.code) === canonical(resolveReference(reference, courses)));
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [onClose]);
  const list = (items: string[], empty: string) => items.length ? <ul>{items.map((item) => {
    const target = courseFor(item);
    return <li key={item}>{target
      ? <button onClick={() => onOpen(target)}>{target.code} — {target.names?.[0]}</button>
      : <strong>{item}</strong>}
    </li>;
  })}</ul> : <p className="empty-detail">{empty}</p>;

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="close-button" onClick={onClose} aria-label="Fechar">×</button>
      <div className="modal-heading"><span className="eyebrow">{course.code}</span><h2 id="modal-title">{course.names?.[0] ?? "Disciplina sem nome"}</h2><div className="modal-tags">{course.period !== undefined && <span>{formatPeriod(course.period)}</span>}{course.category && <span>{formatCategory(course.category)}</span>}{course.hours != null && <span>{course.hours} horas</span>}{course.credits != null && <span>{course.credits} créditos</span>}{splitTracks(course.tracks).map((track) => <span key={`track-${track}`}>{track}</span>)}{(course.mnemonics ?? []).map((mnemonic) => <span key={`mnemonic-${mnemonic}`}>Mnemônico: {mnemonic}</span>)}</div></div>
      <div className="modal-content">
        <section className="detail-section unit-section"><h3>Unidade responsável</h3><p>{course.responsible_unit ?? "Não informada"}</p></section>
        <section className="detail-section"><h3>Ementa</h3><p className="syllabus">{course.syllabus ?? "Ementa não informada."}</p></section>
        <div className="detail-grid"><section className="detail-section requirement-section prerequisite-section"><h3>Pré-requisitos</h3>{list(course.prerequisites ?? [], "Nenhum")}</section><section className="detail-section requirement-section corequisite-section"><h3>Co-requisitos</h3>{list(course.corequisites ?? [], "Nenhum")}</section></div>
        <section className="detail-section requirement-section unlock-section"><h3>Libera</h3>{releases.length ? <ul>{releases.map((item) => <li key={item.code}><button onClick={() => onOpen(item)}>{item.code} — {item.names?.[0]}</button></li>)}</ul> : <p className="empty-detail">Nenhum</p>}</section>
      </div>
    </section>
  </div>;
}
