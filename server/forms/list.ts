import { sortByOptions, sortDirectionOptions, type SortBy, type SortDirection } from '../data/nonAssociationsApi'
import { BaseForm } from './index'

export const tables = ['same', 'other', 'any', 'outside'] as const
export type Table = (typeof tables)[number]

export type ListData = Record<`${Table}Sort`, SortBy> & Record<`${Table}Order`, SortDirection>

export default class ListForm extends BaseForm<ListData> {
  protected validate(): void {
    for (const table of tables) {
      const sortKey = `${table}Sort` as const
      this.data[sortKey] = this.data[sortKey] ?? 'WHEN_UPDATED'
      if (!sortByOptions.includes(this.data[sortKey])) {
        this.addError(sortKey, 'Invalid sort column')
        delete this.data[sortKey]
      }

      const orderKey = `${table}Order` as const
      this.data[orderKey] = this.data[orderKey] ?? 'DESC'
      if (!sortDirectionOptions.includes(this.data[orderKey])) {
        this.addError(orderKey, 'Invalid order')
        delete this.data[orderKey]
      }
    }
  }
}
