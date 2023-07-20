export default {
  templates: {
    home: '/',
    prisonerPhoto: '/prisoner/:prisonerNumber/photo.jpeg',
    view: '/prisoner/:prisonerNumber/non-associations',
    prisonerSearch: '/prisoner/:prisonerNumber/non-associations/add/search-prisoner',
    add: '/prisoner/:prisonerNumber/non-associations/add/with-prisoner/:otherPrisonerNumber',
    edit: '/prisoner/:prisonerNumber/non-associations/edit/with-prisoner/:otherPrisonerNumber',
    close: '/prisoner/:prisonerNumber/non-associations/close//with-prisoner/:otherPrisonerNumber',
  },

  home(): string {
    return this.templates.home
  },

  prisonerPhoto(prisonerNumber: string): string {
    return this.templates.prisonerPhoto.replace(':prisonerNumber', prisonerNumber)
  },

  view(prisonerNumber: string): string {
    return this.templates.view.replace(':prisonerNumber', prisonerNumber)
  },

  prisonerSearch(prisonerNumber: string): string {
    return this.templates.prisonerSearch.replace(':prisonerNumber', prisonerNumber)
  },

  add(prisonerNumber: string, otherPrisonerNumber: string): string {
    return this.templates.add
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':otherPrisonerNumber', otherPrisonerNumber)
  },

  edit(prisonerNumber: string, otherPrisonerNumber: string): string {
    return this.templates.edit
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':otherPrisonerNumber', otherPrisonerNumber)
  },

  close(prisonerNumber: string, otherPrisonerNumber: string): string {
    return this.templates.close
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':otherPrisonerNumber', otherPrisonerNumber)
  },
}
