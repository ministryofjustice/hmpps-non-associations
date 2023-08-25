import Page, { type PageElement } from '../page'

import type { Role, Reason, RestrictionType } from '../../../server/data/nonAssociationsApi'

export default abstract class BaseAddUpdatePage extends Page {
  abstract formId: string

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
  ): PageElement<HTMLInputElement> {
    return this.form.find(`#${this.formId}-${name}`).contains(label).prev()
  }

  getRadioButtonForPrisonerRole(role: Role[keyof Role]): PageElement<HTMLInputElement> {
    return this.getRadioButton('prisonerRole', role)
  }

  getRadioButtonOtherPrisonerRole(role: Role[keyof Role]): PageElement<HTMLInputElement> {
    return this.getRadioButton('otherPrisonerRole', role)
  }

  getRadioButtonReason(reason: Reason[keyof Reason]): PageElement<HTMLInputElement> {
    return this.getRadioButton('reason', reason)
  }

  getRadioButtonRestrictionType(
    restrictionType: RestrictionType[keyof RestrictionType],
  ): PageElement<HTMLInputElement> {
    return this.getRadioButton('restrictionType', restrictionType)
  }

  get commentBox(): PageElement<HTMLTextAreaElement> {
    return this.form.find('.govuk-textarea')
  }
}
