'use client'

import { memo } from 'react'

import type { WidgetCatalogItem } from '../../../types'
import type { ComparatorStyle } from '../../../utils/addComponentCatalog'
import { useComparatorConfigForm } from '../../../hooks/useComparatorConfigForm'
import { ComparatorConfigScreen } from '../../comparator/ComparatorConfigScreen'

export type ComparatorConfigPanelProps = {
  /** Whether the panel is mounted/active — gates data fetching and form reset. */
  active: boolean
  comparatorStyle: ComparatorStyle
  onClose: () => void
  onDone: (item: WidgetCatalogItem) => void
}

/**
 * Embeds the existing Comparator configuration screen (form + preview + footer)
 * into the unified Add Component screen, reusing {@link useComparatorConfigForm}
 * and {@link ComparatorConfigScreen} verbatim so save/payload logic is unchanged.
 */
function ComparatorConfigPanelInner({
  active,
  comparatorStyle,
  onClose,
  onDone,
}: ComparatorConfigPanelProps) {
  const form = useComparatorConfigForm({
    open: active,
    comparatorStyle,
    onDone,
    onClose,
  })

  return (
    <ComparatorConfigScreen
      comparatorStyle={comparatorStyle}
      form={form}
      onCancel={onClose}
      onDone={() => void form.handleDone()}
    />
  )
}

export const ComparatorConfigPanel = memo(ComparatorConfigPanelInner)
