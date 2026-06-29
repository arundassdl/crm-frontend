import type { RelatedModuleOption } from '@/services/api/report-addon/related-module-api'
import type { AggregateOption } from './buildAggregateOptions'
import { aggregateOptionToColumn } from './buildAggregateOptions'
import type { GroupingOption } from './buildGroupingOptions'
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
        durationLastValue?: number | ''
        durationLastUnit?: 'day' | 'week' | 'month'
        durationFromDate?: string
        durationToDate?: string
        criteriaFilters: any[]
        compareTo?: 'Previous Period' | 'Previous Year' | 'Custom' | ''
        objective?: 'increase_positive' | 'decrease_positive' | ''
        comparisonFromDate?: string
        comparisonToDate?: string
        rankField?: string
        rankShow?: 'Top 5' | 'Top 10' | 'Top 20' | 'Bottom 5' | 'Bottom 10' | 'Bottom 20'
        displayRecordCount?: boolean
        shortened?: boolean
        shortenedFormat?: 'K' | 'M' | 'B'
        shortenedDecimalPlaces?: 0 | 1 | 2
        shortenedMeasureIds?: string[]
    }
    moduleOptions: ModuleOption[]
    measureOption: AggregateOption
    relatedModuleOption?: RelatedModuleOption | null
    catalogFields: any[]
    kpiStyle?: string
    rankFieldOption?: GroupingOption | null
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

function groupColumnToDefinition(
    fieldName: string,
    label: string,
    moduleKey: string,
    primaryModule: string,
    moduleOptions: ModuleOption[]
): ReportDefinitionColumn {
    const sourceKey =
        resolveMainDoctypeFromOption(moduleKey.trim() || primaryModule, moduleOptions) ||
        primaryModule
    return {
        label: label.trim() || fieldName,
        alias: label.trim() || fieldName,
        field: fieldName,
        module_label: moduleListingLabel(sourceKey, moduleOptions),
    }
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
        rankFieldOption,
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
            if (form.durationValue === 'Last') {
                filters.push({
                    module: durationFieldOpt.moduleValue,
                    fieldname: durationFieldOpt.field.fieldName,
                    label: durationFieldOpt.field.label,
                    fieldtype: durationFieldOpt.field.fieldtype,
                    operator: 'Last',
                    value: form.durationLastValue || 0,
                    unit: form.durationLastUnit || 'day',
                    condition: 'AND',
                    filtertype: 'Quick',
                })
            } else if (form.durationValue === 'Custom') {
                filters.push({
                    module: durationFieldOpt.moduleValue,
                    fieldname: durationFieldOpt.field.fieldName,
                    label: durationFieldOpt.field.label,
                    fieldtype: durationFieldOpt.field.fieldtype,
                    operator: 'between',
                    value: { from: form.durationFromDate || '', to: form.durationToDate || '' },
                    condition: 'AND',
                    filtertype: 'Quick',
                })
            } else {
                filters.push({
                    module: durationFieldOpt.moduleValue,
                    fieldname: durationFieldOpt.field.fieldName,
                    label: durationFieldOpt.field.label,
                    fieldtype: durationFieldOpt.field.fieldtype,
                    operator: 'between',
                    value: form.durationValue,
                    condition: 'AND',
                    filtertype: 'Quick',
                })
            }
        }
    }

    let dimensions: ReportDefinitionColumn[] = []
    let row_groups: ReportDefinitionColumn[] | undefined
    let orders: unknown[] = []
    let limit = 100

    if (kpiStyle === 'rankings' || kpiStyle === 'scorecard') {
        if (rankFieldOption) {
            const rankCol = groupColumnToDefinition(
                rankFieldOption.fieldName,
                rankFieldOption.fieldLabel,
                rankFieldOption.moduleValue,
                pm,
                moduleOptions
            )
            dimensions = [rankCol]
            row_groups = [rankCol]
        }

        if (form.displayRecordCount) {
            aggregate_columns.push({
                fieldname: '*',
                aggregation: 'count_unique',
                label: 'Record Count',
                module: pm,
            })
        }

        const rankShowMatch = /^(Top|Bottom)\s+(\d+)$/.exec(form.rankShow ?? '')
        const rankDirection = rankShowMatch?.[1] === 'Bottom' ? 'asc' : 'desc'
        limit = rankShowMatch ? Number(rankShowMatch[2]) : 5
        orders = [{ column: measureOption.label, direction: rankDirection }]
    }

    const measures = aggregateColumnsToMeasures(aggregate_columns, pm, moduleOptions)

    const comparison =
        (kpiStyle === 'growth_index' || kpiStyle === 'standard' || kpiStyle === 'scorecard') &&
        form.compareTo &&
        form.objective
            ? {
                compare_to: form.compareTo,
                objective: form.objective,
                ...(form.compareTo === 'Custom'
                    ? { from: form.comparisonFromDate || '', to: form.comparisonToDate || '' }
                    : {}),
            }
            : undefined

    return {
        reportname: form.name.trim(),
        json: {
            columns: [], // No grouping columns for basic KPI
            dimensions,
            ...(row_groups && row_groups.length > 0 ? { row_groups } : {}),
            filters,
            ...(filters.length > 0 ? { report_filters: filters } : {}),
            joins,
            limit,
            measures,
            orders,
            ...(aggregate_columns.length > 0 ? { aggregate_columns } : {}),
            chart_type: kpiStyleToChartType(kpiStyle),
            table: {
                label: primaryLabel,
                table: primaryTable,
            },
            ...(comparison ? { comparison } : {}),
        },
    }
}
