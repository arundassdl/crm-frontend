'use client'

import type { ReactNode } from 'react'

/**
 * Colorful, multi-color SVG icons for the Add Component type selector.
 * Keyed by card id (see navConfig). Each value is the inner SVG markup drawn
 * on a fixed 24x24 viewBox; ComponentTypeIcon supplies the sized <svg> wrapper.
 */

// Shared palette so icons stay visually consistent.
const BLUE = '#3b82f6'
const INDIGO = '#6366f1'
const GREEN = '#22c55e'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const PURPLE = '#a855f7'
const TEAL = '#14b8a6'
const PINK = '#ec4899'
const CYAN = '#06b6d4'
const SLATE = '#94a3b8'

const ICON_PATHS: Record<string, ReactNode> = {
  // ---- Chart types ----
  column: (
    <>
      <rect x="3" y="12" width="3.4" height="9" rx="1" fill={BLUE} />
      <rect x="8.2" y="7" width="3.4" height="14" rx="1" fill={GREEN} />
      <rect x="13.4" y="10" width="3.4" height="11" rx="1" fill={AMBER} />
      <rect x="18.6" y="5" width="3.4" height="16" rx="1" fill={PURPLE} />
    </>
  ),
  bar: (
    <>
      <rect x="3" y="4" width="14" height="3" rx="1.5" fill={BLUE} />
      <rect x="3" y="9" width="18" height="3" rx="1.5" fill={GREEN} />
      <rect x="3" y="14" width="9" height="3" rx="1.5" fill={AMBER} />
      <rect x="3" y="19" width="15" height="3" rx="1.5" fill={PURPLE} />
    </>
  ),
  donut: (
    <g transform="rotate(-90 12 12)" fill="none" strokeWidth="4">
      <circle cx="12" cy="12" r="8" stroke={BLUE} strokeDasharray="14 36.27" strokeDashoffset="0" />
      <circle cx="12" cy="12" r="8" stroke={GREEN} strokeDasharray="11 39.27" strokeDashoffset="-14" />
      <circle cx="12" cy="12" r="8" stroke={AMBER} strokeDasharray="13 37.27" strokeDashoffset="-25" />
      <circle cx="12" cy="12" r="8" stroke={PURPLE} strokeDasharray="12.27 38" strokeDashoffset="-38" />
    </g>
  ),
  pie: (
    <>
      <path d="M12 12 L12 3 A9 9 0 0 1 19.79 16.5 Z" fill={BLUE} />
      <path d="M12 12 L19.79 16.5 A9 9 0 0 1 7.5 19.79 Z" fill={GREEN} />
      <path d="M12 12 L7.5 19.79 A9 9 0 0 1 12 3 Z" fill={AMBER} />
    </>
  ),
  treemap: (
    <>
      <rect x="3" y="3" width="11" height="11" rx="1" fill={BLUE} />
      <rect x="15" y="3" width="6" height="7" rx="1" fill={GREEN} />
      <rect x="15" y="11" width="6" height="10" rx="1" fill={AMBER} />
      <rect x="3" y="15" width="11" height="6" rx="1" fill={PURPLE} />
    </>
  ),
  butterfly: (
    <>
      <rect x="2" y="4" width="10" height="3" rx="1" fill={BLUE} />
      <rect x="12" y="4" width="7" height="3" rx="1" fill={AMBER} />
      <rect x="5" y="10.5" width="7" height="3" rx="1" fill={BLUE} />
      <rect x="12" y="10.5" width="9" height="3" rx="1" fill={AMBER} />
      <rect x="3" y="17" width="9" height="3" rx="1" fill={BLUE} />
      <rect x="12" y="17" width="6" height="3" rx="1" fill={AMBER} />
      <line x1="12" y1="3" x2="12" y2="21" stroke={SLATE} strokeWidth="1" />
    </>
  ),
  live: (
    <>
      <polyline
        points="3,16 8,11 13,14 18,6 21,9"
        fill="none"
        stroke={INDIGO}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="3" cy="16" r="1.7" fill={BLUE} />
      <circle cx="8" cy="11" r="1.7" fill={GREEN} />
      <circle cx="13" cy="14" r="1.7" fill={AMBER} />
      <circle cx="18" cy="6" r="1.7" fill={RED} />
      <circle cx="21" cy="9" r="1.7" fill={PURPLE} />
    </>
  ),
  funnel: (
    <>
      <polygon points="3,4 21,4 17.5,8 6.5,8" fill={BLUE} />
      <polygon points="7,9 17,9 14.5,13 9.5,13" fill={GREEN} />
      <polygon points="10,14 14,14 12.8,18 11.2,18" fill={AMBER} />
      <rect x="11.2" y="19" width="1.6" height="2.5" rx="0.5" fill={PURPLE} />
    </>
  ),
  area: (
    <>
      <path d="M3 15 L8 9 L13 12 L18 6 L21 9 L21 21 L3 21 Z" fill={CYAN} fillOpacity="0.3" />
      <path d="M3 18 L8 14 L13 16 L18 11 L21 13 L21 21 L3 21 Z" fill={BLUE} fillOpacity="0.35" />
      <polyline
        points="3,15 8,9 13,12 18,6 21,9"
        fill="none"
        stroke={BLUE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  progress: (
    <g transform="rotate(-90 12 12)" fill="none" strokeWidth="3.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" stroke="#e5e7eb" />
      <circle cx="12" cy="12" r="8" stroke={GREEN} strokeDasharray="33 50.27" />
    </g>
  ),
  scatter: (
    <>
      <circle cx="5" cy="16" r="1.7" fill={RED} />
      <circle cx="8" cy="9" r="1.7" fill={BLUE} />
      <circle cx="11" cy="14" r="1.7" fill={GREEN} />
      <circle cx="14" cy="7" r="1.7" fill={AMBER} />
      <circle cx="17" cy="12" r="1.7" fill={PURPLE} />
      <circle cx="19" cy="18" r="1.7" fill={TEAL} />
      <circle cx="7" cy="19" r="1.7" fill={PINK} />
      <circle cx="15" cy="17" r="1.7" fill={CYAN} />
    </>
  ),

  // ---- KPI types ----
  basic: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke={RED} strokeWidth="2" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke={AMBER} strokeWidth="2" />
      <circle cx="12" cy="12" r="2.2" fill={BLUE} />
    </>
  ),
  growth_index: (
    <>
      <polyline
        points="3,18 9,12 13,15 20,6"
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="15,6 20,6 20,11"
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="3" cy="18" r="1.5" fill={BLUE} />
    </>
  ),
  standard: (
    <>
      <rect x="3" y="13" width="3.6" height="6" rx="1" fill={BLUE} />
      <rect x="8.2" y="9" width="3.6" height="10" rx="1" fill={GREEN} />
      <rect x="13.4" y="6" width="3.6" height="13" rx="1" fill={AMBER} />
      <polygon points="19,4 22,4 20.5,1.5" fill={RED} />
      <line x1="2" y1="20.5" x2="22" y2="20.5" stroke={SLATE} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  scorecard: (
    <>
      <path d="M7 4 H17 V7 A5 5 0 0 1 7 7 Z" fill={AMBER} />
      <path d="M7 5 H4 V7 A3 3 0 0 0 7 10" fill="none" stroke="#d97706" strokeWidth="1.5" />
      <path d="M17 5 H20 V7 A3 3 0 0 1 17 10" fill="none" stroke="#d97706" strokeWidth="1.5" />
      <rect x="11" y="12" width="2" height="4" fill="#d97706" />
      <rect x="7.5" y="16" width="9" height="2.6" rx="1" fill={AMBER} />
      <polygon points="12,5 12.9,6.8 14.8,7 13.4,8.4 13.8,10.3 12,9.4 10.2,10.3 10.6,8.4 9.2,7 11.1,6.8" fill="#fff" />
    </>
  ),
  rankings: (
    <>
      <path d="M8 13 L6 21 L9.5 18.5 Z" fill={BLUE} />
      <path d="M16 13 L18 21 L14.5 18.5 Z" fill={RED} />
      <circle cx="12" cy="9" r="6" fill={AMBER} stroke="#d97706" strokeWidth="1.4" />
      <polygon points="12,5.5 13,8 15.6,8 13.5,9.6 14.3,12.2 12,10.7 9.7,12.2 10.5,9.6 8.4,8 11,8" fill="#fff" />
    </>
  ),

  // ---- Comparator types ----
  elegant: (
    <>
      <path d="M11 21 q0 -6.5 5.5 -6.5 q5.5 0 5.5 6.5 Z" fill={GREEN} />
      <circle cx="16.5" cy="8.5" r="2.8" fill={GREEN} />
      <path d="M2 21 q0 -7 6.5 -7 q6.5 0 6.5 7 Z" fill={BLUE} />
      <circle cx="8.5" cy="8" r="3.2" fill={BLUE} />
    </>
  ),
  sport: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" fill="#fff" stroke={INDIGO} strokeWidth="1.5" />
      <path d="M3 9 H21" stroke={INDIGO} strokeWidth="1.5" />
      <rect x="6.5" y="3" width="2" height="4" rx="1" fill={RED} />
      <rect x="15.5" y="3" width="2" height="4" rx="1" fill={RED} />
      <circle cx="8" cy="13" r="1.3" fill={GREEN} />
      <circle cx="12" cy="13" r="1.3" fill={AMBER} />
      <circle cx="16" cy="13" r="1.3" fill={BLUE} />
      <circle cx="8" cy="17.5" r="1.3" fill={PURPLE} />
      <circle cx="12" cy="17.5" r="1.3" fill={TEAL} />
    </>
  ),
  classic: (
    <>
      <rect x="3" y="10" width="5" height="11" rx="1" fill={BLUE} />
      <rect x="9.5" y="5" width="5" height="16" rx="1" fill={GREEN} />
      <rect x="16" y="8" width="5" height="13" rx="1" fill={AMBER} />
      <rect x="4.4" y="12" width="2.2" height="1.6" rx="0.3" fill="#fff" fillOpacity="0.85" />
      <rect x="10.9" y="8" width="2.2" height="1.6" rx="0.3" fill="#fff" fillOpacity="0.85" />
      <rect x="17.4" y="11" width="2.2" height="1.6" rx="0.3" fill="#fff" fillOpacity="0.85" />
    </>
  ),

  // ---- Stage types ----
  standard_staircase: (
    <>
      <rect x="3" y="5" width="11" height="3.4" rx="0.8" fill={BLUE} />
      <rect x="3" y="10.3" width="8.5" height="3.4" rx="0.8" fill={INDIGO} />
      <rect x="3" y="15.6" width="6" height="3.4" rx="0.8" fill={GREEN} />
      <line x1="14" y1="6.7" x2="11.5" y2="12" stroke={SLATE} strokeWidth="1.2" strokeDasharray="2 1.5" />
      <line x1="11.5" y1="12" x2="9" y2="17.3" stroke={SLATE} strokeWidth="1.2" strokeDasharray="2 1.5" />
    </>
  ),
}

export function hasComponentTypeIcon(id: string): boolean {
  return id in ICON_PATHS
}

export function ComponentTypeIcon({ id, size = 30 }: { id: string; size?: number }) {
  const paths = ICON_PATHS[id]
  if (!paths) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: 'block' }}
    >
      {paths}
    </svg>
  )
}
