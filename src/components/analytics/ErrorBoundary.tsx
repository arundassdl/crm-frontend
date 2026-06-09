'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import AnalyticsUnavailable from '@/components/analytics/AnalyticsUnavailable'

type Props = { children: ReactNode; fallback?: ReactNode }

type State = { hasError: boolean }

/**
 * Catches render errors inside the federated analytics chunk so the main CRM shell keeps running.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MF Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <AnalyticsUnavailable />
    }

    return this.props.children
  }
}
