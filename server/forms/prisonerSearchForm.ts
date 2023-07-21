import { BaseForm } from './index'

export type PrisonerSearchData = {
  q: string
  page: number
}

export default class PrisonerSearchForm extends BaseForm<PrisonerSearchData> {
  protected validate(): void {
    if (!this.data.q || /^\s*$/.test(this.data.q)) {
      this.addError('q', 'Enter a name or prison number')
    } else {
      this.data.q = this.data.q.trim()
    }

    this.data.page = parseInt(this.data.page as unknown as string, 10)
    if (Number.isNaN(this.data.page) || this.data.page < 1) {
      this.addError('page', 'Invalid page number')
      delete this.data.page
    }
  }
}
