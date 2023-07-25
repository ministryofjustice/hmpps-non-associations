import { BaseForm } from './index'

export const roleOptions = {
  VICTIM: 'Victim',
  PERPETRATOR: 'Perpetrator',
  NOT_RELEVANT: 'Not relevant',
  UNKNOWN: 'Unknown',
} as const
export type Role = typeof roleOptions

export const reasonOptions = {
  BULLYING: 'Bullying',
  GANG_RELATED: 'Gang related',
  ORGANISED_CRIME: 'Organised crime',
  LEGAL_REQUEST: 'Police or legal request',
  THREAT: 'Threat',
  VIOLENCE: 'Violence',
  OTHER: 'Other',
} as const
export type Reason = typeof reasonOptions

export const restrictionTypeOptions = {
  CELL: 'Cell only',
  LANDING: 'Cell and landing',
  WING: 'Cell, landing and wing',
}
export type RestrictionType = typeof restrictionTypeOptions

export type AddData = {
  prisonerRole: keyof Role
  otherPrisonerRole: keyof Role
  reason: keyof Reason
  restrictionType: keyof RestrictionType
  comment: string
}

export default class AddForm extends BaseForm<AddData> {
  protected validate(): void {
    if (!(this.data.prisonerRole in roleOptions)) {
      this.addError('prisonerRole', 'Select prisoner’s role in the situation')
      delete this.data.prisonerRole
    }
    if (!(this.data.otherPrisonerRole in roleOptions)) {
      this.addError('otherPrisonerRole', 'Select prisoner’s role in the situation')
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
    }
  }
}
