import {
  type SortBy,
  type SortDirection,
  sortByOptions,
  sortDirectionOptions,
} from '@ministryofjustice/hmpps-non-associations-api'

import { BaseForm } from './index'

export const tables = ['same', 'other', 'any', 'outside'] as const
export type Table = (typeof tables)[number]

export const threeTables: Table[] = ['same', 'other', 'outside']
export const twoTables: Table[] = ['any', 'outside']

export type ListData = Record<`${Table}Sort`, SortBy> & Record<`${Table}Order`, SortDirection>

const defaultSort: SortBy = 'WHEN_UPDATED'
const defaultOrder: SortDirection = 'DESC'

export default class ListForm extends BaseForm<ListData> {
  protected validate(): void {
    for (const table of tables) {
      const sortKey = `${table}Sort` as const
      this.data[sortKey] = this.data[sortKey] ?? defaultSort
      if (!sortByOptions.includes(this.data[sortKey])) {
        this.addError(sortKey, 'Invalid sort column')
        delete this.data[sortKey]
      }

      const orderKey = `${table}Order` as const
      this.data[orderKey] = this.data[orderKey] ?? defaultOrder
      if (!sortDirectionOptions.includes(this.data[orderKey])) {
        this.addError(orderKey, 'Invalid order')
        delete this.data[orderKey]
      }
    }
  }

  getUrlPrefixForOtherTables(groups: 'three' | 'two', table: Table): string {
    let otherTables: Table[]
    if (groups === 'three') {
      otherTables = threeTables.filter(otherTable => otherTable !== table)
    } else if (groups === 'two') {
      otherTables = twoTables.filter(otherTable => otherTable !== table)
    } else {
      throw new Error('Unknown table')
    }
    const params: string[] = []
    otherTables.forEach(otherTable => {
      const sortParam: `${Table}Sort` = `${otherTable}Sort`
      const sortValue = this.fields[sortParam].value
      if (sortValue !== defaultSort) {
        params.push(`${sortParam}=${sortValue}`)
      }
      const orderParam: `${Table}Order` = `${otherTable}Order`
      const orderValue = this.fields[orderParam].value
      if (orderValue !== defaultOrder) {
        params.push(`${orderParam}=${orderValue}`)
      }
    })
    if (params.length) {
      return `?${params.join('&')}&`
    }
    return '?'
  }
}
