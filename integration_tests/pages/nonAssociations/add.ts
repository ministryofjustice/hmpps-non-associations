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
}
