"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getMyBallot, saveBallot } from "@/lib/api/fanVotes";
import { slotPointsFor } from "@/lib/fanvotes/tracker";
import { getToken } from "@/lib/auth/cookies";
import { useAuthModal } from "@/context/AuthModalContext";

function SortableRow({ player, index, onMove, count }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: player?.id });

  if (!player) return null;

  const pts = slotPointsFor(index);
  const topFive = index < 5;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-white dark:bg-gray-900 ${
        isDragging ? "z-10 shadow-lg border-primary-400" : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to re-rank ${player.name}`}
        className="cursor-grab touch-none px-1 text-gray-400 hover:text-gray-600"
      >
        ⠿
      </button>
      <span
        className={`w-6 shrink-0 text-center text-sm font-bold tabular-nums ${
          topFive ? "text-primary-500" : "text-gray-400"
        }`}
      >
        {index + 1}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={player.photo}
        alt={player.name}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
      />
      <span className="min-w-0 flex-grow truncate text-sm font-medium text-gray-800 dark:text-gray-100">
        {player.name}
      </span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
          topFive
            ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
            : "bg-gray-100 text-gray-400 dark:bg-gray-800"
        }`}
      >
        {pts} pt{pts === 1 ? "" : "s"}
      </span>
      <span className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          aria-label={`Move ${player.name} up`}
          className="px-1 text-[10px] leading-3 text-gray-400 hover:text-primary-500 disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index === count - 1}
          aria-label={`Move ${player.name} down`}
          className="px-1 text-[10px] leading-3 text-gray-400 hover:text-primary-500 disabled:opacity-30"
        >
          ▼
        </button>
      </span>
    </li>
  );
}

export default function BallotPanel({ players, onSaved, getBallot = getMyBallot }) {
  const { openLogin } = useAuthModal();
  const isAuthed = Boolean(getToken());

  const [order, setOrder] = useState(null); // player ids, rank 1 first
  const [savedOrder, setSavedOrder] = useState([]);
  const [weight, setWeight] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { ok: bool, text: string }
  const mounted = useRef(true);
  const orderRef = useRef(null);
  const prevAuthRef = useRef(null); // null = "not yet initialized"

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    (players || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [players]);

  // Stable signature of roster membership (ids only, sorted) — unlike the
  // `players` array reference, this only changes when a player actually
  // joins/leaves the roster, not on every silent auto-refresh tick.
  const rosterSig = useMemo(
    () =>
      (players || [])
        .map((p) => p.id)
        .sort((a, b) => a - b)
        .join(","),
    [players]
  );

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // Build the initial order once (saved ballot first, dropping any id no
  // longer on the roster, then everyone unranked appended alphabetically).
  // On later roster-membership changes, reconcile the CURRENT order in
  // place instead of refetching/rebuilding — this is what keeps an
  // in-progress unsaved drag order alive across the 60s auto-refresh.
  // Also rebuild (rather than reconcile) whenever the auth state itself
  // changes — e.g. an in-place login/logout via the modal — so the real
  // saved ballot + vote weight load without requiring a page refresh.
  useEffect(() => {
    const authChanged = prevAuthRef.current !== null && prevAuthRef.current !== isAuthed;
    prevAuthRef.current = isAuthed;

    let active = true;
    (async () => {
      const roster = (players || []).map((p) => p.id);

      if (orderRef.current === null || authChanged) {
        const mine = isAuthed ? await getBallot() : { order: [], weight: 1 };
        if (!active || !mounted.current) return;
        const saved = mine.order.filter((id) => byId.has(id));
        const rest = [...roster]
          .filter((id) => !saved.includes(id))
          .sort((a, b) => byId.get(a).name.localeCompare(byId.get(b).name));
        setOrder([...saved, ...rest]);
        setSavedOrder(saved);
        setWeight(mine.weight);
        return;
      }

      // Roster membership changed while a list already exists: keep
      // existing ids in their current positions, drop ids no longer on the
      // roster, append genuinely new roster ids at the bottom (alphabetical
      // among themselves). No refetch, no rebuild from savedOrder.
      const rosterSet = new Set(roster);
      setOrder((current) => {
        const kept = current.filter((id) => rosterSet.has(id));
        const keptSet = new Set(kept);
        const added = roster
          .filter((id) => !keptSet.has(id))
          .sort((a, b) => byId.get(a).name.localeCompare(byId.get(b).name));
        return [...kept, ...added];
      });
      setSavedOrder((current) => current.filter((id) => rosterSet.has(id)));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, rosterSig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!players || players.length === 0) return null;

  const hasSaved = savedOrder.length > 0;
  const changed = order !== null && JSON.stringify(order) !== JSON.stringify(savedOrder);

  const move = (from, dir) => {
    const to = from + dir;
    if (to < 0 || to >= order.length) return;
    setOrder((o) => arrayMove(o, from, to));
    setMessage(null);
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setOrder((o) => arrayMove(o, o.indexOf(active.id), o.indexOf(over.id)));
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveBallot(order);
      if (!mounted.current) return;
      setSavedOrder(order);
      setMessage({ ok: true, text: "Rankings saved. They stay in effect until you change them." });
      await onSaved?.();
    } catch (e) {
      if (!mounted.current) return;
      setMessage({ ok: false, text: e.message || "Could not save. Please try again." });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl text-primary-500 dark:text-primary-400">
          My Rankings
        </h2>
        {isAuthed && weight > 1 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Your votes count {weight}x
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Drag the cast into your order. Your list keeps counting every day until you change it.
      </p>

      {!isAuthed ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-6 text-center">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Log in to rank your favorites. Your #1 pick earns the most points.
          </p>
          <button type="button" onClick={openLogin} className="btn-primary text-sm">
            Log in to vote
          </button>
        </div>
      ) : order === null ? (
        <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <ul className="max-h-[480px] space-y-1.5 overflow-y-auto pr-1">
                {order.map((id, i) => (
                  <SortableRow
                    key={id}
                    player={byId.get(id)}
                    index={i}
                    onMove={move}
                    count={order.length}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || (!changed && hasSaved)}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : hasSaved ? "Update my rankings" : "Save my rankings"}
            </button>
            {!hasSaved && !message && (
              <span className="text-xs text-gray-400">Not counted until you save</span>
            )}
          </div>
          {message && (
            <p
              role="status"
              className={`mt-2 text-xs ${message.ok ? "text-green-600" : "text-red-500"}`}
            >
              {message.text}
            </p>
          )}
        </>
      )}
    </section>
  );
}
