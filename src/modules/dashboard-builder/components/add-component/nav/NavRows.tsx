'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'

import {
  SOURCE_OPTIONS,
  type ComponentSource,
  type TypeCard,
} from '../navConfig'
import { ComponentTypeIcon, hasComponentTypeIcon } from '../componentTypeIcons'

/** Row 1 — prominent segmented source toggle (Chart / Chart From Report). */
function SourceToggleInner({
  value,
  onChange,
}: {
  value: ComponentSource
  onChange: (source: ComponentSource) => void
}) {
  return (
    <Box
      role="tablist"
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        width: '100%',
        maxWidth: 520,
        p: 0.75,
        gap: 0.75,
        borderRadius: 2.5,
        bgcolor: 'action.hover',
      }}
    >
      {SOURCE_OPTIONS.map(opt => {
        const selected = value === opt.id
        return (
          <Box
            key={opt.id}
            role="tab"
            aria-selected={selected}
            component="button"
            type="button"
            onClick={() => onChange(opt.id)}
            sx={{
              border: 0,
              cursor: 'pointer',
              minHeight: 48,
              px: 3,
              borderRadius: 2,
              fontSize: '0.9375rem',
              fontWeight: 600,
              transition: 'all 0.15s',
              bgcolor: selected ? 'background.paper' : 'transparent',
              color: selected ? 'primary.main' : 'text.secondary',
              boxShadow: selected ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              '&:hover': {
                color: selected ? 'primary.main' : 'text.primary',
                bgcolor: selected ? 'background.paper' : 'action.selected',
              },
            }}
          >
            {opt.label}
          </Box>
        )
      })}
    </Box>
  )
}

export const SourceToggle = memo(SourceToggleInner)

/** A single compact, colorful icon card. */
function TypeCard({
  card,
  selected,
  onSelect,
}: {
  card: TypeCard
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      title={card.label}
      aria-pressed={selected}
      sx={{
        position: 'relative',
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        cursor: 'pointer',
        width: 68,
        height: 68,
        px: 0.5,
        py: 0.75,
        borderRadius: 1.5,
        border: selected ? 2 : 1,
        transition: 'all 0.15s',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.lightOpacity' : 'background.paper',
        color: selected ? 'primary.main' : 'text.secondary',
        boxShadow: selected ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
        '&:hover': {
          borderColor: 'primary.main',
          color: 'primary.main',
          bgcolor: selected ? 'primary.lightOpacity' : 'action.hover',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      {selected && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 15,
            height: 15,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <i className="ri-check-line" style={{ fontSize: 10, lineHeight: 1 }} />
        </Box>
      )}
      <Box sx={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasComponentTypeIcon(card.id) ? (
          <ComponentTypeIcon id={card.id} size={24} />
        ) : (
          <i className={`${card.icon} text-xl`} aria-hidden />
        )}
      </Box>
      <Typography
        noWrap
        sx={{
          maxWidth: '100%',
          fontSize: '0.625rem',
          fontWeight: 500,
          lineHeight: 1.2,
          textAlign: 'center',
          color: selected ? 'primary.main' : 'text.primary',
        }}
      >
        {card.label}
      </Typography>
    </Box>
  )
}

/** Left/right scroll affordance for the single-row type selector. */
function ScrollArrow({
  direction,
  visible,
  onClick,
}: {
  direction: 'left' | 'right'
  visible: boolean
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
      sx={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.secondary',
        cursor: 'pointer',
        transition: 'all 0.15s',
        visibility: visible ? 'visible' : 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
      }}
    >
      <i
        className={direction === 'left' ? 'ri-arrow-left-s-line' : 'ri-arrow-right-s-line'}
        style={{ fontSize: 20, lineHeight: 1 }}
        aria-hidden
      />
    </Box>
  )
}

/** Row 2 — single horizontal, scrollable row of compact icon cards. */
function TypeCardsInner({
  cards,
  value,
  onChange,
}: {
  cards: TypeCard[]
  value: string
  onChange: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 1)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  // Reset to the start and recompute reachability when the card set changes.
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
    updateArrows()
  }, [updateArrows, cards])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [updateArrows])

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ScrollArrow direction="left" visible={canLeft} onClick={() => scrollBy(-240)} />
      <Box
        ref={scrollRef}
        onScroll={updateArrows}
        sx={{
          display: 'flex',
          gap: 1,
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          py: 0.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {cards.map(card => (
          <TypeCard
            key={card.id}
            card={card}
            selected={value === card.id}
            onSelect={() => onChange(card.id)}
          />
        ))}
      </Box>
      <ScrollArrow direction="right" visible={canRight} onClick={() => scrollBy(240)} />
    </Box>
  )
}

export const TypeCards = memo(TypeCardsInner)
