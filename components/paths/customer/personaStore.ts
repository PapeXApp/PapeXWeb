"use client";

import { useSyncExternalStore } from "react";
import type { PersonaId } from "./content";

/**
 * The quiz -> feature rows hand-off (both live in section 04, Personas.tsx):
 * which persona the visitor's last quiz result was, or null before they
 * finish it.
 *
 * IN MEMORY ONLY, on purpose (spec §8b: "the order does not persist beyond
 * the visit"): no localStorage, no cookie, and no React provider — a module
 * variable plus useSyncExternalStore, so the quiz and the rows stay sibling
 * components and neither re-renders the whole section.
 *
 * `onBeforePersonaChange` listeners run synchronously inside `setPersona`,
 * BEFORE React re-renders with the new value. Features uses that moment to
 * measure where its rows sit (the "First" of FLIP) while the DOM still holds
 * the old order.
 */

let current: PersonaId | null = null;
const listeners = new Set<() => void>();
const beforeListeners = new Set<(next: PersonaId | null) => void>();

export function setPersona(next: PersonaId | null) {
  if (next === current) return;
  beforeListeners.forEach((fn) => fn(next));
  current = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function onBeforePersonaChange(fn: (next: PersonaId | null) => void) {
  beforeListeners.add(fn);
  return () => {
    beforeListeners.delete(fn);
  };
}

const getSnapshot = () => current;
/** The server never knows a result: first paint is always the default order. */
const getServerSnapshot = () => null;

export function usePersona(): PersonaId | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * "Change my answers" from the rows' header: the quiz listens and restarts at
 * Question 1 (the header then scrolls the quiz into view itself). Returns
 * true when a quiz handled it.
 */
const retakeListeners = new Set<() => void>();

export function requestRetake(): boolean {
  retakeListeners.forEach((fn) => fn());
  return retakeListeners.size > 0;
}

export function onRetakeRequest(fn: () => void) {
  retakeListeners.add(fn);
  return () => {
    retakeListeners.delete(fn);
  };
}
