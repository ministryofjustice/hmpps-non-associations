import { SortBy, sortByOptions, SortDirection, sortDirectionOptions } from '../data/nonAssociationsApi'
import ListForm, { type ListData, type Table, tables } from './list'

const validEmptyPayload: Partial<ListData> = {}
const validDefaultPayload: ListData = {
  sameSort: 'WHEN_UPDATED',
  sameOrder: 'DESC',
  otherSort: 'WHEN_UPDATED',
  otherOrder: 'DESC',
  anySort: 'WHEN_UPDATED',
  anyOrder: 'DESC',
  outsideSort: 'WHEN_UPDATED',
  outsideOrder: 'DESC',
}

describe('ListForm', () => {
  it('should be valid with an empty payload', () => {
    const form = new ListForm()
    form.submit(validEmptyPayload)
    expect(form.hasErrors).toBeFalsy()
    tables.forEach(table => {
      expect(form.fields[`${table}Sort`].value).toEqual<SortBy>('WHEN_UPDATED')
      expect(form.fields[`${table}Order`].value).toEqual<SortDirection>('DESC')
    })
  })

  function expectValidPayload(table: Table, sort: SortBy, order: SortDirection, payload: Partial<ListData>): void {
    const form = new ListForm()
    form.submit(payload)
    expect(form.hasErrors).toBeFalsy()
    expect(form.fields[`${table}Sort`].value).toEqual(sort)
    expect(form.fields[`${table}Order`].value).toEqual(order)

    // check fallbacks
    tables.forEach(otherTable => {
      sortByOptions.forEach(otherSort => {
        sortDirectionOptions.forEach(otherOrder => {
          if (otherTable !== table && otherSort !== sort && otherOrder !== order) {
            expect(form.fields[`${otherTable}Sort`].value).toEqual<SortBy>('WHEN_UPDATED')
            expect(form.fields[`${otherTable}Order`].value).toEqual<SortDirection>('DESC')
          }
        })
      })
    })
  }

  function expectInvalidPayload(payload: unknown, field: keyof ListData): void {
    const form = new ListForm()
    form.submit(payload)
    expect(form.hasErrors).toBeTruthy()
    expect(form.fields[field].error).toBeTruthy()
  }

  describe.each(tables)('sorting "%s" table', table => {
    describe.each(sortByOptions)('by "%s"', sort => {
      describe.each(sortDirectionOptions)('%s', order => {
        it('should be sufficient to be valid', () => {
          expectValidPayload(table, sort, order, {
            [`${table}Sort`]: sort,
            [`${table}Order`]: order,
          })
        })

        it('should be valid if all parameters are provided', () => {
          expectValidPayload(table, sort, order, {
            ...validDefaultPayload,
            [`${table}Sort`]: sort,
            [`${table}Order`]: order,
          })
        })
      })

      it('should be invalid when order is incorrect', () => {
        expectInvalidPayload(
          {
            [`${table}Order`]: 'reversed',
          },
          `${table}Order`,
        )
      })

      it('should be invalid when order is incorrect but other options are correctly provided', () => {
        expectInvalidPayload(
          {
            ...validDefaultPayload,
            [`${table}Order`]: 'reversed',
          },
          `${table}Order`,
        )
      })
    })

    it('should not allow an unknown sort-by column', () => {
      expectInvalidPayload(
        {
          [`${table}Sort`]: 'UNKNOWN_COLUMN',
        },
        `${table}Sort`,
      )
    })
  })
})
