import { BaseForm } from './index'
import { maxCommentLength } from '../data/nonAssociationsApi'

export type CloseData = {
  closedReason: string
}

export default class CloseForm extends BaseForm<CloseData> {
  protected validate(): void {
    if (!this.data.closedReason || /^\s*$/.test(this.data.closedReason)) {
      this.addError('closedReason', 'Enter a comment')
    } else {
      this.data.closedReason = this.data.closedReason.trim()
      if (this.data.closedReason.length > maxCommentLength) {
        this.addError('closedReason', `Comment must be ${maxCommentLength} characters or less`)
      }
    }
  }
}
