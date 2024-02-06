import type { Role, Reason, RestrictionType } from '@ministryofjustice/hmpps-non-associations-api'

import Page, { type PageElement } from '../page'

export default abstract class BaseAddUpdatePage extends Page {
  abstract formId: string

  constructor() {
    super('Non-association details', 'Enter non-association details')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('form')
  }

  get saveButton(): PageElement<HTMLButtonElement> {
    return this.form.find('.govuk-button').contains<HTMLButtonElement>('Save')
  }

  get cancelButton(): PageElement<HTMLAnchorElement> {
    return this.form.find('.govuk-button').contains<HTMLAnchorElement>('Cancel')
  }

  private getRadioButton(
    name: 'prisonerRole' | 'otherPrisonerRole' | 'reason' | 'restrictionType',
    label: string,
  ): PageElement<HTMLLabelElement> {
    return this.form.find<HTMLLabelElement>(`#${this.formId}-${name}`).contains(label)
  }

  getRadioButtonForPrisonerRole(role: Role[keyof Role]): PageElement<HTMLLabelElement> {
    return this.getRadioButton('prisonerRole', role)
  }

  getRadioButtonOtherPrisonerRole(role: Role[keyof Role]): PageElement<HTMLLabelElement> {
    return this.getRadioButton('otherPrisonerRole', role)
  }

  getRadioButtonReason(reason: Reason[keyof Reason]): PageElement<HTMLLabelElement> {
    return this.getRadioButton('reason', reason)
  }

  getRadioButtonRestrictionType(
    restrictionType: RestrictionType[keyof RestrictionType],
  ): PageElement<HTMLLabelElement> {
    return this.getRadioButton('restrictionType', restrictionType)
  }

  get commentBox(): PageElement<HTMLTextAreaElement> {
    return this.form.find('.govuk-textarea')
  }
}
