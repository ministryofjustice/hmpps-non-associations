import { type PageElement } from '../page'

import BaseAddUpdatePage from './baseAddUpdate'

export default class UpdatePage extends BaseAddUpdatePage {
  formId = 'update'

  constructor() {
    super('Non-association details')
  }

  getUpdateCommentBox(): PageElement<HTMLElement> {
    return cy.get('#update-comment')
  }

  getUpdateButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
