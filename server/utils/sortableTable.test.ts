import { type HeaderCell, type SortableTableColumns, sortableTableHead } from './sortableTable'

type Column = 'month' | 'rate'
const sampleColumns: SortableTableColumns<Column> = [
  { column: 'month', escapedHtml: 'Month you apply' },
  { column: 'rate', escapedHtml: 'Rate for vehicles' },
]

describe('sortableTableHead', () => {
  describe('should label sorted column with aria attribute', () => {
    it('when a column is sorted ascending', () => {
      expect(
        sortableTableHead<Column>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'month',
          order: 'ASC',
        }),
      ).toEqual<HeaderCell[]>([
        {
          html: expect.stringContaining('Month you apply'),
          attributes: { 'aria-sort': 'ascending' },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: { 'aria-sort': 'none' },
        },
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(
        sortableTableHead<Column>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'rate',
          order: 'DESC',
        }),
      ).toEqual<HeaderCell[]>([
        {
          html: expect.stringContaining('Month you apply'),
          attributes: { 'aria-sort': 'none' },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: { 'aria-sort': 'descending' },
        },
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(
        sortableTableHead<string>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'unknown',
          order: 'DESC',
        }),
      ).toEqual<HeaderCell[]>([
        {
          html: expect.stringContaining('Month you apply'),
          attributes: { 'aria-sort': 'none' },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: { 'aria-sort': 'none' },
        },
      ])
    })
  })

  describe('should link column to sort action', () => {
    it('when a column is sorted ascending', () => {
      expect(
        sortableTableHead<Column>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'month',
          order: 'ASC',
        }),
      ).toEqual([
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=ASC') }),
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(
        sortableTableHead<Column>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'rate',
          order: 'DESC',
        }),
      ).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=ASC') }),
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(
        sortableTableHead<string>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'unknown',
          order: 'DESC',
        }),
      ).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=DESC') }),
      ])
    })
  })

  describe('should allow changing the query parameters', () => {
    it('when a column is sorted ascending', () => {
      expect(
        sortableTableHead<Column>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'month',
          order: 'ASC',
          sortParameter: 'sortBy',
          orderParameter: 'sortDirection',
        }),
      ).toEqual([
        // flip order if same column clicked
        expect.objectContaining({
          html: expect.stringContaining('?size=large&amp;sortBy=month&amp;sortDirection=DESC'),
        }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sortBy=rate&amp;sortDirection=ASC') }),
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(
        sortableTableHead<Column>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'rate',
          order: 'DESC',
          sortParameter: 'sortBy',
          orderParameter: 'sortDirection',
        }),
      ).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({
          html: expect.stringContaining('?size=large&amp;sortBy=month&amp;sortDirection=DESC'),
        }),
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sortBy=rate&amp;sortDirection=ASC') }),
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(
        sortableTableHead<string>({
          columns: sampleColumns,
          urlPrefix: '?size=large&',
          sortColumn: 'unknown',
          order: 'DESC',
          sortParameter: 'sortBy',
          orderParameter: 'sortDirection',
        }),
      ).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({
          html: expect.stringContaining('?size=large&amp;sortBy=month&amp;sortDirection=DESC'),
        }),
        // preserve same order if different column clicked
        expect.objectContaining({
          html: expect.stringContaining('?size=large&amp;sortBy=rate&amp;sortDirection=DESC'),
        }),
      ])
    })
  })

  describe('should work with unsortable columns', () => {
    const sampleColumnsWithUnsortable: SortableTableColumns<string> = [
      { column: 'icon', escapedHtml: '<span class="govuk-visually-hidden">Icon &amp; label</span>', unsortable: true },
      ...sampleColumns,
    ]

    it('when another column is sorted', () => {
      const tableHead = sortableTableHead<string>({
        columns: sampleColumnsWithUnsortable,
        urlPrefix: '?size=large&',
        sortColumn: 'month',
        order: 'ASC',
      })
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        {
          html: expect.stringContaining('Month you apply'),
          attributes: { 'aria-sort': 'ascending' },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: { 'aria-sort': 'none' },
        },
      ])
    })

    it('when the unsortable column is sorted', () => {
      const tableHead = sortableTableHead<string>({
        columns: sampleColumnsWithUnsortable,
        urlPrefix: '?size=large&',
        sortColumn: 'icon',
        order: 'DESC',
      })
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        {
          html: expect.stringContaining('Month you apply'),
          attributes: { 'aria-sort': 'none' },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: { 'aria-sort': 'none' },
        },
      ])
    })
  })

  it('should allow adding classes', () => {
    const sampleColumnsWithClasses: SortableTableColumns<'A' | 'B' | 'C' | 'D'> = [
      { column: 'A', escapedHtml: 'A', classes: 'table-cell-a' },
      { column: 'B', escapedHtml: 'B', classes: 'table-cell-b' },
      { column: 'C', escapedHtml: 'C', classes: 'table-cell-c' },
      { column: 'D', escapedHtml: 'D' },
    ]
    const tableHead = sortableTableHead<'A' | 'B' | 'C' | 'D'>({
      columns: sampleColumnsWithClasses,
      urlPrefix: '?',
      sortColumn: 'D',
      order: 'DESC',
    })
    expect(tableHead).toEqual<HeaderCell[]>([
      {
        html: expect.stringContaining('"?sort=A&amp;order=DESC"'),
        classes: 'table-cell-a',
        attributes: { 'aria-sort': 'none' },
      },
      {
        html: expect.stringContaining('"?sort=B&amp;order=DESC"'),
        classes: 'table-cell-b',
        attributes: { 'aria-sort': 'none' },
      },
      {
        html: expect.stringContaining('"?sort=C&amp;order=DESC"'),
        classes: 'table-cell-c',
        attributes: { 'aria-sort': 'none' },
      },
      { html: expect.stringContaining('"?sort=D&amp;order=ASC"'), attributes: { 'aria-sort': 'descending' } },
    ])
  })
})
