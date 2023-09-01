import { sortByOptions, sortDirectionOptions, type SortBy, type SortDirection } from '../data/nonAssociationsApi'
import { BaseForm } from './index'

export const tables = ['same', 'other', 'any', 'outside'] as const
export type Table = (typeof tables)[number]

export type ListData = {
  sort: SortBy
  order: SortDirection
}

export default class ListForm extends BaseForm<ListData> {
  protected validate(): void {
    this.data.sort = this.data.sort ?? 'WHEN_UPDATED'
    if (!sortByOptions.includes(this.data.sort)) {
      this.addError('sort', 'Invalid sort column')
      delete this.data.sort
    }

    this.data.order = this.data.order ?? 'DESC'
    if (!sortDirectionOptions.includes(this.data.order)) {
      this.addError('order', 'Invalid order')
      delete this.data.order
    }
  }
}
