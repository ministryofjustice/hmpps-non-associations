type AriaSort = 'ascending' | 'descending' | 'none'

export type HeaderCell =
  | {
      html: string
      attributes: {
        'aria-sort': AriaSort
        'data-ga-category'?: string
        'data-ga-action'?: string
      }
    }
  | { html: string }

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
  columns: { column: Column; escapedHtml: string; unsortable?: true }[]
  urlPrefix: string
  sortColumn: Column
  order: 'ASC' | 'DESC'
}): HeaderCell[] {
  return columns.map(({ column, escapedHtml, unsortable }) => {
    if (unsortable) {
      return { html: escapedHtml }
    }

    let sortQuery: string
    let sortDescription: string
    if (column === sortColumn) {
      // flips order of the currently sorted column
      if (order === 'ASC') {
        sortQuery = `sort=${column}&amp;order=DESC`
        sortDescription = '<span class="govuk-visually-hidden">(sorted ascending)</span>'
      } else {
        sortQuery = `sort=${column}&amp;order=ASC`
        sortDescription = '<span class="govuk-visually-hidden">(sorted descending)</span>'
      }
    } else {
      // preserves order if another column is sorted by
      sortQuery = `sort=${column}&amp;order=${order}`
      sortDescription = ''
    }
    const ariaSort =
      column === sortColumn
        ? {
            ASC: 'ascending',
            DESC: 'descending',
          }[order]
        : 'none'
    return {
      html: `<a href="${urlPrefix}&amp;${sortQuery}">${escapedHtml} ${sortDescription}</a>`,
      attributes: {
        'aria-sort': ariaSort,
      },
    }
  })
}

export type SortableTableColumns<T> = Parameters<typeof sortableTableHead<T>>[0]['columns']
