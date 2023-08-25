import { type PageElement } from '../page'

import BaseAddUpdatePage from './baseAddUpdate'

export default class AddPage extends BaseAddUpdatePage {
  formId = 'add'

  constructor() {
    super('Non-association details')
  }

  getAddCommentBox(): PageElement<HTMLElement> {
    return cy.get('#add-comment')
  }

  getSaveButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
