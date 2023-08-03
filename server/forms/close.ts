import { BaseForm } from './index'
import { maxCommentLength } from '../data/nonAssociationsApi'

export type CloseData = {
  closureReason: string
}

export default class CloseForm extends BaseForm<CloseData> {
  protected validate(): void {
    if (!this.data.closureReason || /^\s*$/.test(this.data.closureReason)) {
      this.addError('closureReason', 'Enter a comment')
    } else {
      this.data.closureReason = this.data.closureReason.trim()
      if (this.data.closureReason.length > maxCommentLength) {
        this.addError('closureReason', `Comment must be ${maxCommentLength} characters or less`)
      }
    }
  }
}
