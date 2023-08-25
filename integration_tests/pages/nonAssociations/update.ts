import BaseAddUpdatePage from './baseAddUpdate'

export default class UpdatePage extends BaseAddUpdatePage {
  formId = 'update'

  constructor() {
    super('Non-association details')
  }
}
