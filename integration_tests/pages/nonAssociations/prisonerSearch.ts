import Page, { type PageElement } from '../page'

export default class PrisonerSearchPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  get scopeRadioButtons(): PageElement<HTMLLabelElement> {
    return cy.get('.govuk-radios__input[name=scope]').next()
  }

  get inputField(): PageElement<HTMLInputElement> {
    return cy.get('#search-q')
  }

  get searchButton(): PageElement<HTMLButtonElement> {
    return cy.get('button[class="govuk-button"]')
  }

  get tables(): PageElement<HTMLTableElement> {
    return cy.get('.app-sortable-table')
  }

  get tableHeader(): PageElement<HTMLTableCellElement> {
    return this.tables.find('thead tr th')
  }

  getTableHeaderSortingLink(column: number): PageElement<HTMLAnchorElement> {
    return this.tableHeader.eq(column).find('a')
  }

  get tableRows(): PageElement<HTMLTableRowElement> {
    return this.tables.find('tbody tr')
  }

  get tableRowContents(): Cypress.Chainable<string[][]> {
    return this.tableRows.then(bodyRows => {
      const rows = bodyRows
        .map((_, row) => {
          const cells: string[] = []
          for (let index = 0; index < row.children.length; index += 1) {
            cells.push(row.children[index]?.textContent?.trim())
          }
          return { cells }
        })
        .toArray()
      return cy.wrap(rows.map(({ cells }) => cells))
    })
  }

  getSelectLinkForRow(row: number): PageElement<HTMLAnchorElement> {
    return this.tableRows.eq(row).find('td').last().find('a')
  }
}
