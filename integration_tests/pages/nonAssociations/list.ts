import Page, { type PageElement } from '../page'

export default class ListPage extends Page {
  constructor(private readonly prisonerName: string) {
    super(`${prisonerName} non-associations`)
  }

  get addButton(): PageElement<HTMLAnchorElement> {
    return cy.get('.govuk-button').contains<HTMLAnchorElement>('Add new non-association')
  }

  get tabs(): PageElement<HTMLLIElement> {
    return cy.get('.govuk-tabs__list-item')
  }

  get openTab(): PageElement<HTMLLIElement> {
    return this.tabs.eq(0)
  }

  get closedTab(): PageElement<HTMLLIElement> {
    return this.tabs.eq(1)
  }

  get table(): PageElement<HTMLTableElement> {
    return cy.get('.app-sortable-table')
  }

  get tableRows(): PageElement<HTMLTableRowElement> {
    return this.table.find('tbody tr')
  }

  getViewLinkForRow(row: number): PageElement<HTMLAnchorElement> {
    return this.tableRows.eq(row).find('td').last().find('a')
  }
}
