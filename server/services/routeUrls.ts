export default {
  templates: {
    home: '/',
    prisonerPhoto: '/prisoner/:prisonerNumber/photo.jpeg',
    list: '/prisoner/:prisonerNumber/non-associations',
    listClosed: '/prisoner/:prisonerNumber/non-associations/closed',
    prisonerSearch: '/prisoner/:prisonerNumber/non-associations/add/search-prisoner',
    add: '/prisoner/:prisonerNumber/non-associations/add/with-prisoner/:otherPrisonerNumber',
    view: '/prisoner/:prisonerNumber/non-associations/:nonAssociationId',
    close: '/prisoner/:prisonerNumber/non-associations/:nonAssociationId/close',
    update: '/prisoner/:prisonerNumber/non-associations/:nonAssociationId/update',
  } as const,

  home(): string {
    return this.templates.home
  },

  prisonerPhoto(prisonerNumber: string): string {
    return this.templates.prisonerPhoto.replace(':prisonerNumber', prisonerNumber)
  },

  list(prisonerNumber: string, closed = false): string {
    if (closed) {
      return this.templates.listClosed.replace(':prisonerNumber', prisonerNumber)
    }
    return this.templates.list.replace(':prisonerNumber', prisonerNumber)
  },

  prisonerSearch(prisonerNumber: string): string {
    return this.templates.prisonerSearch.replace(':prisonerNumber', prisonerNumber)
  },

  add(prisonerNumber: string, otherPrisonerNumber: string): string {
    return this.templates.add
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':otherPrisonerNumber', otherPrisonerNumber)
  },

  view(prisonerNumber: string, nonAssociationId: number): string {
    return this.templates.view
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':nonAssociationId', String(nonAssociationId))
  },

  close(prisonerNumber: string, nonAssociationId: number): string {
    return this.templates.close
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':nonAssociationId', String(nonAssociationId))
  },

  update(prisonerNumber: string, nonAssociationId: number): string {
    return this.templates.update
      .replace(':prisonerNumber', prisonerNumber)
      .replace(':nonAssociationId', String(nonAssociationId))
  },
}
