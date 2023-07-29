import { renderString } from 'nunjucks'

type AriaSort = 'ascending' | 'descending' | 'none'

export type HeaderCell = {
  html: string
  classes?: string
  attributes?: {
    'aria-sort': AriaSort
  }
}

/**
 * Produces parameters for head of GOV.UK Table component macro
 * to label sortable columns and add links
 */
export function sortableTableHead<Column = string>({
  columns,
  urlPrefix,
  sortColumn,
  order,
}: {
  columns: { column: Column; escapedHtml: string; unsortable?: true; classes?: string }[]
  urlPrefix: string
  sortColumn: Column
  order: 'ASC' | 'DESC'
}): HeaderCell[] {
  return columns.map(({ column, escapedHtml, unsortable, classes }) => {
    if (unsortable) {
      return { html: escapedHtml, classes }
    }

    let sortQuery: string
    let sortDescriptionHtml: string
    if (column === sortColumn) {
      // flips order of the currently sorted column
      if (order === 'ASC') {
        sortQuery = `sort=${column}&order=DESC`
        sortDescriptionHtml = '<span class="govuk-visually-hidden">(sorted ascending)</span>'
      } else {
        sortQuery = `sort=${column}&order=ASC`
        sortDescriptionHtml = '<span class="govuk-visually-hidden">(sorted descending)</span>'
      }
    } else {
      // preserves order if another column is sorted by
      sortQuery = `sort=${column}&order=${order}`
      sortDescriptionHtml = ''
    }

    const ariaSortMap = {
      ASC: 'ascending',
      DESC: 'descending',
    } as const
    const ariaSort: AriaSort = column === sortColumn ? ariaSortMap[order] : 'none'

    const html = renderString(
      '<a href="{{ urlPrefix }}{{ sortQuery }}">{{ escapedHtml | safe }} {{ sortDescriptionHtml | safe }}</a>',
      {
        urlPrefix,
        escapedHtml,
        sortQuery,
        sortDescriptionHtml,
      },
    )

    return {
      html,
      classes,
      attributes: {
        'aria-sort': ariaSort,
      },
    }
  })
}

export type SortableTableColumns<T> = Parameters<typeof sortableTableHead<T>>[0]['columns']
