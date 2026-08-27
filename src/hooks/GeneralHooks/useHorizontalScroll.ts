"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface HorizontalScrollState {
  /** The content is wider than the container, so scrolling is possible. */
  overflowing: boolean;
  /** Scrolled fully to the left — the "scroll left" affordance has nowhere to go. */
  atStart: boolean;
  /** Scrolled fully to the right. */
  atEnd: boolean;
}

/**
 * `scrollLeft` is fractional (and browser zoom makes it more so), while
 * `scrollWidth`/`clientWidth` are integers. A couple of pixels of slack keeps
 * an arrow from being stuck enabled at a boundary it can't actually move past.
 */
const EDGE_TOLERANCE = 2;

/**
 * Track the horizontal scroll position of a strip and scroll it programmatically.
 *
 * Used by the status/stage strips (listing status tabs, Lead and Deal detail
 * stage pipelines) to drive left/right navigation arrows. Native scrolling —
 * touch, trackpad, shift+wheel — keeps working; the arrows are an extra
 * affordance, which is why callers render them only while `overflowing`.
 *
 * `ref` is a *callback* ref rather than an object ref on purpose. Callers mount
 * the strip behind async guards (`if (loading) return …`), so the node appears
 * on a later render than the one the hook first ran on. A callback ref re-runs
 * the binding effect exactly when the node attaches or detaches, which an object
 * ref cannot do — with `useRef`, an effect that ran while `ref.current` was null
 * would never attach its scroll listener and the arrows would stay frozen at
 * their initial state.
 *
 * @param deps values that change the *content* width (e.g. the status list).
 *             Container and child resizes are picked up by the ResizeObserver,
 *             so this is only a safety net — its length must stay constant.
 */
export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  // Mirrors the node in a ref for the listeners, and in state so the effect
  // re-runs the moment the element mounts.
  const nodeRef = useRef<T | null>(null);
  const [node, setNode] = useState<T | null>(null);
  /** Pending re-measure scheduled after a programmatic (smooth) scroll. */
  const settleTimer = useRef<number | null>(null);

  const ref = useCallback((el: T | null) => {
    nodeRef.current = el;
    setNode(el);
  }, []);

  const [state, setState] = useState<HorizontalScrollState>({
    overflowing: false,
    atStart: true,
    atEnd: false,
  });

  const sync = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const next: HorizontalScrollState = {
      overflowing: maxScroll > EDGE_TOLERANCE,
      atStart: el.scrollLeft <= EDGE_TOLERANCE,
      atEnd: el.scrollLeft >= maxScroll - EDGE_TOLERANCE,
    };
    // Keep the previous object when nothing changed: `sync` runs on every scroll
    // frame, and a fresh object each time would re-render the whole strip.
    setState((prev) =>
      prev.overflowing === next.overflowing && prev.atStart === next.atStart && prev.atEnd === next.atEnd
        ? prev
        : next
    );
  }, []);

  useEffect(() => {
    if (!node) return;

    sync();
    node.addEventListener("scroll", sync, { passive: true });

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    if (observer) {
      // The container: viewport changes, sidebar collapse, arrows appearing.
      observer.observe(node);
      // The children too — options arriving change the *content* width without
      // resizing the container, which an observer on the container alone misses.
      Array.from(node.children).forEach((child) => observer.observe(child));
    }

    return () => {
      node.removeEventListener("scroll", sync);
      observer?.disconnect();
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, sync, ...deps]);

  /** Scroll by most of a "page", leaving a sliver of context. */
  const scrollByDirection = useCallback((direction: -1 | 1) => {
    const el = nodeRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.75, 160), behavior: "smooth" });

    // A smooth scroll settles asynchronously. The trailing `scroll` event
    // normally carries the final position, but it can be coalesced — re-sync
    // once the animation is done so an arrow never lags a click behind.
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      settleTimer.current = null;
      sync();
    }, 400);
  }, [sync]);

  return { ref, ...state, scrollByDirection, sync };
}

export default useHorizontalScroll;
