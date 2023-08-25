import BaseAddUpdatePage from './baseAddUpdate'

export default class AddPage extends BaseAddUpdatePage {
  formId = 'add'

  constructor() {
    super('Non-association details')
  }
}
