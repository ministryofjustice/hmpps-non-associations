import {
  type SortBy,
  type SortDirection,
  sortByOptions,
  sortDirectionOptions,
} from '@ministryofjustice/hmpps-non-associations-api'

import ListForm, { type ListData, type Table, tables } from './list'

function validEmptyPayload(): Partial<ListData> {
  return {}
}

function validDefaultPayload(): ListData {
  return {
    sameSort: 'WHEN_UPDATED',
    sameOrder: 'DESC',
    otherSort: 'WHEN_UPDATED',
    otherOrder: 'DESC',
    anySort: 'WHEN_UPDATED',
    anyOrder: 'DESC',
    outsideSort: 'WHEN_UPDATED',
    outsideOrder: 'DESC',
  }
}

describe('ListForm', () => {
  it('should be valid with an empty payload', () => {
    const form = new ListForm()
    form.submit(validEmptyPayload())
    expect(form.hasErrors).toBeFalsy()
    tables.forEach(table => {
      expect(form.fields[`${table}Sort`].value).toEqual<SortBy>('WHEN_UPDATED')
      expect(form.fields[`${table}Order`].value).toEqual<SortDirection>('DESC')
    })
  })

  it('should allow changing default sort and order', () => {
    const form = new ListForm('WHEN_CLOSED', 'ASC')
    form.submit(validEmptyPayload())
    expect(form.hasErrors).toBeFalsy()
    tables.forEach(table => {
      expect(form.fields[`${table}Sort`].value).toEqual<SortBy>('WHEN_CLOSED')
      expect(form.fields[`${table}Order`].value).toEqual<SortDirection>('ASC')
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
            ...validDefaultPayload(),
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
            ...validDefaultPayload(),
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

  describe('building a url prefix for a table should work', () => {
    const scenarios: {
      scenario: string
      payload: Partial<ListData>
      groups: 'three' | 'two'
      table: Table
      expected: string
    }[] = [
      {
        scenario: 'the payload is empty',
        payload: {},
        groups: 'three',
        table: 'same',
        expected: '?',
      },
      {
        scenario: 'other tables’ options aren’t provided',
        payload: { sameSort: 'PRISON_NAME', sameOrder: 'ASC' },
        groups: 'three',
        table: 'same',
        expected: '?',
      },
      {
        scenario: 'another tables’ default options are provided',
        payload: { sameSort: 'WHEN_UPDATED', sameOrder: 'DESC' },
        groups: 'three',
        table: 'outside',
        expected: '?',
      },
      {
        scenario: 'another tables’ part-default options are provided',
        payload: { sameSort: 'WHEN_UPDATED', sameOrder: 'ASC' },
        groups: 'three',
        table: 'outside',
        expected: '?sameOrder=ASC&',
      },
      {
        scenario: 'another tables’ non-default options are provided',
        payload: { sameSort: 'PRISON_NAME', sameOrder: 'ASC' },
        groups: 'three',
        table: 'outside',
        expected: '?sameSort=PRISON_NAME&sameOrder=ASC&',
      },
      {
        scenario: 'all tables have options provided',
        payload: { anySort: 'WHEN_CREATED', anyOrder: 'ASC', outsideSort: 'WHEN_CREATED', outsideOrder: 'ASC' },
        groups: 'two',
        table: 'outside',
        expected: '?anySort=WHEN_CREATED&anyOrder=ASC&',
      },
    ]
    it.each(scenarios)('when $scenario', ({ payload, groups, table, expected }) => {
      const form = new ListForm()
      form.submit(payload)
      expect(form.hasErrors).toBeFalsy()
      expect(form.getUrlPrefixForOtherTables(groups, table)).toEqual(expected)
    })
  })
})
