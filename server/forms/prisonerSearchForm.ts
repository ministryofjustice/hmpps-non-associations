import { sortOptions, orderOptions, type Sort, type Order } from '../data/offenderSearch'
import { BaseForm } from './index'

export type PrisonerSearchData = {
  q: string
  scope: 'prison' | 'global'
  page: number
  sort: Sort
  order: Order
}

export default class PrisonerSearchForm extends BaseForm<PrisonerSearchData> {
  protected validate(): void {
    if (!this.data.q || /^\s*$/.test(this.data.q)) {
      this.addError('q', 'Enter a name or prison number')
    } else {
      this.data.q = this.data.q.trim()
    }

    if (!this.data.scope) {
      this.data.scope = 'prison'
    } else if (this.data.scope !== 'prison' && this.data.scope !== 'global') {
      this.addError('scope', 'Invalid scope')
    }

    this.data.page = parseInt(this.data.page as unknown as string, 10)
    if (Number.isNaN(this.data.page) || this.data.page < 1) {
      this.addError('page', 'Invalid page number')
      delete this.data.page
    }

    this.data.sort = this.data.sort ?? 'lastName'
    if (!sortOptions.includes(this.data.sort)) {
      this.addError('sort', 'Invalid sort')
      delete this.data.sort
    }
    this.data.order = this.data.order ?? 'ASC'
    if (!orderOptions.includes(this.data.order)) {
      this.addError('sort', 'Invalid order')
      delete this.data.order
    }
  }
}
