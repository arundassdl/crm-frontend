import type { RelatedModuleOption } from '@/services/api/report-addon/related-module-api'
import type { AggregateOption } from './buildAggregateOptions'
import { aggregateOptionToColumn } from './buildAggregateOptions'
import { quickChartFiltersToDefinition } from './report-filters/quick-chart-filter-mapper'
import {
    resolveMainDoctypeFromOption,
    tabNameFromMainDoctypeName,
} from './moduleTableName'
import type {
    ReportAggregateColumn,
    ReportDefinitionColumn,
    ReportDefinitionFilter,
    ReportDefinitionJoin,
    ReportDefinitionJson,
} from '../types/reportDefinition'
import { kpiStyleToChartType } from './resolveKpiStyle'

export type ModuleOption = { value: string; label: string }

export type BuildKpiReportDefinitionInput = {
    form: {
        name: string
        primaryModule: string
        relatedModule: string
        measure: string
        durationField: string
        durationValue: string
        criteriaFilters: any[]
    }
    moduleOptions: ModuleOption[]
    measureOption: AggregateOption
    relatedModuleOption?: RelatedModuleOption | null
    catalogFields: any[]
    kpiStyle?: string
}

function moduleListingLabel(labelOrValue: string, options: ModuleOption[] = []): string {
    const t = labelOrValue.trim()
    if (!t) return ''
    const byValue = options.find(o => o.value === t)
    if (byValue) return (byValue.label ?? byValue.value).trim()
    const byLabel = options.find(o => (o.label ?? '').trim() === t)
    if (byLabel) return (byLabel.label ?? byLabel.value).trim()
    return t
}

function aggregateColumnsToMeasures(
    aggregateColumns: ReportAggregateColumn[],
    primaryModule: string,
    moduleOptions: ModuleOption[]
): Record<string, unknown>[] {
    const measures: Record<string, unknown>[] = []
    for (const col of aggregateColumns) {
        const modKey =
            resolveMainDoctypeFromOption(
                (col.module ?? primaryModule).trim() || primaryModule,
                moduleOptions
            ) || primaryModule
        const table = tabNameFromMainDoctypeName(modKey)
        const aggregation =
            col.aggregation === 'count_unique' ? 'distinct_count' : col.aggregation
        const column = col.fieldname === '*' ? 'name' : col.fieldname
        measures.push({
            aggregation,
            alias: col.label,
            column,
            label: col.label,
            table,
            type: 'Decimal',
            expression: {},
            format: {},
            granularity: '',
            order: '',
        })
    }
    return measures
}

export function buildKpiReportDefinition(
    input: BuildKpiReportDefinitionInput
): { reportname: string; json: ReportDefinitionJson } {
    const {
        form,
        moduleOptions = [],
        measureOption,
        relatedModuleOption,
        catalogFields,
        kpiStyle = 'standard',
    } = input

    const pm =
        resolveMainDoctypeFromOption(form.primaryModule.trim(), moduleOptions) ||
        form.primaryModule.trim()
    const primaryLabel = moduleListingLabel(pm, moduleOptions)
    const primaryTable = tabNameFromMainDoctypeName(pm)

    const aggregate_columns: ReportAggregateColumn[] = [
        aggregateOptionToColumn(measureOption, moduleOptions)
    ]

    const joins: ReportDefinitionJoin[] = []
    if (form.relatedModule.trim()) {
        const relValue =
            resolveMainDoctypeFromOption(form.relatedModule.trim(), moduleOptions) ||
            form.relatedModule.trim()
        const relLabel =
            relatedModuleOption?.label ??
            moduleListingLabel(relValue, moduleOptions) ??
            relValue
        joins.push({
            from_label: primaryLabel,
            from_table: primaryTable,
            to_label: relLabel,
            to_table: tabNameFromMainDoctypeName(relValue),
            join_type: 'left',
            internal_key: relatedModuleOption?.internal_key?.trim() || null,
        })
    }

    const filters = quickChartFiltersToDefinition(form.criteriaFilters)

    // Dynamic Duration Filter
    if (form.durationField && form.durationValue && form.durationValue !== 'Select duration') {
        const durationFieldOpt = catalogFields.find(f => f.key === form.durationField)
        if (durationFieldOpt) {
            filters.push({
                module: durationFieldOpt.moduleValue,
                fieldname: durationFieldOpt.fieldName,
                label: durationFieldOpt.fieldLabel,
                fieldtype: durationFieldOpt.field.fieldtype,
                operator: 'between',
                value: form.durationValue,
                condition: 'AND',
                filtertype: 'Quick',
            })
        }
    }

    const measures = aggregateColumnsToMeasures(aggregate_columns, pm, moduleOptions)

    return {
        reportname: form.name.trim(),
        json: {
            columns: [], // No grouping columns for basic KPI
            dimensions: [],
            filters,
            ...(filters.length > 0 ? { report_filters: filters } : {}),
            joins,
            limit: 100,
            measures,
            orders: [],
            ...(aggregate_columns.length > 0 ? { aggregate_columns } : {}),
            chart_type: kpiStyleToChartType(kpiStyle),
            table: {
                label: primaryLabel,
                table: primaryTable,
            },
        },
    }
}
