import type { Reason, RestrictionType, Role } from '@ministryofjustice/hmpps-non-associations-api'
import { roleOptions, reasonOptions, restrictionTypeOptions } from '@ministryofjustice/hmpps-non-associations-api'

import format from '../utils/format'
import { maxCommentLength } from '../data/nonAssociationsApi'
import { BaseForm } from './index'

export type NonAssociationFormData = {
  prisonerRole: keyof Role
  otherPrisonerRole: keyof Role
  reason: keyof Reason
  restrictionType: keyof RestrictionType
  comment: string
}

export default class NonAssociationForm extends BaseForm<NonAssociationFormData> {
  constructor(
    readonly prisonerName = 'prisoner',
    readonly otherPrisonerName: string = 'other prisoner',
  ) {
    super()
  }

  protected validate(): void {
    if (!(this.data.prisonerRole in roleOptions)) {
      this.addError('prisonerRole', `Select ${format.possessiveName(this.prisonerName)} role in the situation`)
      delete this.data.prisonerRole
    }
    if (!(this.data.otherPrisonerRole in roleOptions)) {
      this.addError(
        'otherPrisonerRole',
        `Select ${format.possessiveName(this.otherPrisonerName)} role in the situation`,
      )
      delete this.data.otherPrisonerRole
    }

    if (!(this.data.reason in reasonOptions)) {
      this.addError('reason', 'Select a reason for the non-association')
      delete this.data.reason
    }

    if (!(this.data.restrictionType in restrictionTypeOptions)) {
      this.addError('restrictionType', 'Select where to keep the prisoners apart')
      delete this.data.restrictionType
    }

    if (!this.data.comment || /^\s*$/.test(this.data.comment)) {
      this.addError('comment', 'Enter a comment')
    } else {
      this.data.comment = this.data.comment.trim()
      if (this.data.comment.length > maxCommentLength) {
        this.addError('comment', `Comment must be ${maxCommentLength} characters or less`)
      }
    }
  }
}
