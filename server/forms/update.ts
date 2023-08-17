import type { NonAssociation } from '../data/nonAssociationsApi'
import NonAssociationForm from './nonAssociation'

export default class UpdateForm extends NonAssociationForm {
  constructor(
    readonly prisonerName = 'prisoner',
    readonly otherPrisonerName: string = 'other prisoner',
    readonly nonAssociation: NonAssociation = null,
  ) {
    super()
  }

  protected validate(): void {
    super.validate()

    if (this.data.comment && this.data.comment === this.nonAssociation?.comment) {
      this.addError('comment', 'Enter a comment to explain what you are updating')
    }
  }
}
