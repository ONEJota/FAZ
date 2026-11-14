"use client";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { setJobStatus } from "@/app/actions/jobs";

export type Card = {
  id: number;
  number: number;
  title: string;
  client: string;
  due: string; // ISO
  late: boolean;
  priority: boolean;
  statusId: number;
  statusName: string;
  statusColor: string;
  service: string;
  people: { name: string; color: string }[];
  openTasks: number;
};
export type Column = { id: string; title: string; color?: string; statusId?: number; cards: Card[] };

export function KanbanBoard({ columns, draggable }: { columns: Column[]; draggable: boolean }) {
  const [, start] = useTransition();
  const [cols, move] = useOptimistic(columns, (state, { cardId, to }: { cardId: number; to: string }) => {
    const card = state.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (!card) return state;
    return state.map((c) => ({
      ...c,
      cards: c.id === to ? [...c.cards.filter((x) => x.id !== cardId), card] : c.cards.filter((x) => x.id !== cardId),
    }));
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const to = String(e.over.id);
    const col = cols.find((c) => c.id === to);
    const cardId = Number(e.active.id);
    if (!col?.statusId) return;
    const current = cols.find((c) => c.cards.some((x) => x.id === cardId));
    if (current?.id === to) return;
    start(async () => {
      move({ cardId, to });
      await setJobStatus(cardId, col.statusId!);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {cols.map((col) => (
          <KanbanColumn key={col.id} col={col} draggable={draggable} />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ col, draggable }: { col: Column; draggable: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id, disabled: !draggable });
  return (
    <div ref={setNodeRef} className={`flex w-72 shrink-0 flex-col rounded-xl bg-black/[.035] ${isOver ? "ring-2 ring-mona" : ""}`}>
      <div className="flex items-center gap-2 rounded-t-xl px-3 py-2.5" style={col.color ? { borderTop: `4px solid ${col.color}` } : undefined}>
        <span className="text-sm font-bold">{col.title}</span>
        <span className="rounded-full bg-white px-2 text-xs font-semibold text-black/55">{col.cards.length}</span>
      </div>
      <div className="flex min-h-24 flex-col gap-2 p-2">
        {col.cards.map((c) => (
          <KanbanCard key={c.id} card={c} draggable={draggable} />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ card, draggable }: { card: Card; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id, disabled: !draggable });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  const due = new Date(card.due);
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border bg-white p-3 shadow-sm ${card.late ? "border-red-300" : "border-black/5"} ${isDragging ? "z-50 rotate-1 opacity-90 shadow-lg" : ""} ${draggable ? "cursor-grab" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={card.late ? "font-semibold text-red-600" : "text-black/50"}>
          {due.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
        <Link href={`/jobs/${card.id}`} className="font-bold text-mona hover:underline" onPointerDown={(e) => e.stopPropagation()}>
          #{card.number}
        </Link>
      </div>
      <span className="chip mb-1.5 text-white" style={{ background: card.statusColor }}>{card.statusName}</span>
      <Link href={`/jobs/${card.id}`} className="block text-sm font-semibold leading-snug hover:text-mona" onPointerDown={(e) => e.stopPropagation()}>
        {card.priority && <span className="mr-1 text-red-600">●</span>}
        {card.title}
      </Link>
      <p className="mt-0.5 truncate text-xs text-black/50">{card.client} · {card.service}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex -space-x-1.5">
          {card.people.slice(0, 4).map((p) => (
            <span key={p.name} title={p.name} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white" style={{ background: p.color }}>
              {p.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
            </span>
          ))}
        </span>
        {card.openTasks > 0 && <span className="text-xs text-black/45">☑ {card.openTasks}</span>}
      </div>
    </div>
  );
}
