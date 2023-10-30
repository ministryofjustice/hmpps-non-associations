import { davidJones, fredMills, oscarJones } from '../../server/data/testData/offenderSearch'
import ListPage from '../pages/nonAssociations/list'

context('List non-associations page', () => {
  let listPage: ListPage

  beforeEach(() => {
    cy.resetBasicStubs()
    cy.navigateToDavidJonesNonAssociations().then(result => {
      listPage = result
    })
  })

  it('shows username in fallback header', () => {
    listPage.headerUserName.should('contain.text', 'J. Smith')
  })

  it('shows basic links in fallback header', () => {
    listPage.footer.should('contain.text', 'Official sensitive')
    listPage.footerLinks.should('contain.text', 'Get help')
  })

  it('shows feedback banner', () => {
    listPage.checkFeedbackBanner()
  })

  it('has correct breadcrumb', () => {
    listPage.checkLastBreadcrumb('Jones, David')
  })

  it('has add button', () => {
    listPage.addButton.should('exist')
  })

  it('should show key prisoner’s details', () => {
    listPage.miniProfileHeader.should('contain.text', 'Jones, David')
    listPage.miniProfileHeader.should('contain.text', davidJones.prisonerNumber)
    listPage.miniProfileHeader.should('contain.text', davidJones.cellLocation)
  })

  it('should have open tab selected', () => {
    listPage.openTab.should('have.class', 'govuk-tabs__list-item--selected')
    listPage.openTab.should('contain.text', '2 records')
    listPage.closedTab.should('contain.text', '0 records')
  })

  it('should show a table of open non-associations', () => {
    listPage.tables.should('have.length', 1)

    listPage.getTableHeader(0).spread((...th: HTMLTableCellElement[]) => {
      const [photo, name, location, role, restrictionType, updatedDate, actions] = th
      expect(photo.textContent).to.contain('Photo')
      expect(name.textContent).to.contain('Name')
      expect(name.attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(location.textContent).to.contain('Location')
      expect(location.attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(role.textContent).to.contain('David Jones’ role')
      expect(restrictionType.textContent).to.contain('Where')
      expect(updatedDate.textContent).to.contain('Last updated')
      expect(updatedDate.attributes.getNamedItem('aria-sort').value).to.equal('descending')
      expect(actions.textContent).to.contain('Actions')
    })

    listPage.getTableRowContents(0).then(rows => {
      expect(rows).to.have.length(2)
      const [fredMillsRow, oscarJonesRow] = rows

      expect(fredMillsRow[1]).to.contain(fredMills.prisonerNumber)
      expect(fredMillsRow[1]).to.contain('Mills, Fred')
      expect(fredMillsRow[2]).to.contain('1-1-002')
      expect(fredMillsRow[3]).to.contain('Perpetrator')
      expect(fredMillsRow[4]).to.contain('Cell and landing')
      expect(fredMillsRow[5]).to.contain('26/07/2023')

      expect(oscarJonesRow[1]).to.contain(oscarJones.prisonerNumber)
      expect(oscarJonesRow[1]).to.contain('Jones, Oscar')
      expect(oscarJonesRow[2]).to.contain('1-1-003')
      expect(oscarJonesRow[3]).to.contain('Not relevant')
      expect(oscarJonesRow[4]).to.contain('Cell only')
      expect(oscarJonesRow[5]).to.contain('21/07/2023')
    })
  })

  it('should allow sorting table by ascending location', () => {
    listPage.getTableHeaderSortingLink(0, 2).should('contain.text', 'Location')
    listPage.getTableHeaderSortingLink(0, 2).click()

    listPage.getTableHeader(0).spread((...th: HTMLTableCellElement[]) => {
      expect(th[1].attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(th[2].attributes.getNamedItem('aria-sort').value).to.equal('descending')
      expect(th[5].attributes.getNamedItem('aria-sort').value).to.equal('none')
    })
    listPage.getTableRowContents(0).then(rows => {
      const [oscarJonesRow, fredMillsRow] = rows
      expect(fredMillsRow[2]).to.contain('1-1-002')
      expect(oscarJonesRow[2]).to.contain('1-1-003')
      expect(fredMillsRow[2] < oscarJonesRow[2]).to.be.equal(true)
    })

    listPage.getTableHeaderSortingLink(0, 2).click()

    listPage.getTableHeader(0).spread((...th: HTMLTableCellElement[]) => {
      expect(th[1].attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(th[2].attributes.getNamedItem('aria-sort').value).to.equal('ascending')
      expect(th[5].attributes.getNamedItem('aria-sort').value).to.equal('none')
    })
    listPage.getTableRowContents(0).then(rows => {
      const [fredMillsRow, oscarJonesRow] = rows
      expect(fredMillsRow[2]).to.contain('1-1-002')
      expect(oscarJonesRow[2]).to.contain('1-1-003')
      expect(fredMillsRow[2] < oscarJonesRow[2]).to.be.equal(true)
    })
  })

  it('should display the closed tab', () => {
    listPage.closedTab.should('not.have.class', 'govuk-tabs__list-item--selected')
    cy.task('stubListNonAssociations', { returning: 'twoClosed' })
    listPage.closedTab.find('a').click()
    listPage.closedTab.should('have.class', 'govuk-tabs__list-item--selected')

    listPage.getTableHeader(0).spread((...th: HTMLTableCellElement[]) => {
      expect(th[1].attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(th[2].attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(th[5].attributes.getNamedItem('aria-sort').value).to.equal('descending')
      expect(th[5].textContent).to.contain('Date closed')
    })
    listPage.getTableRowContents(0).then(rows => {
      const [oscarJonesRow, fredMillsRow] = rows
      expect(oscarJonesRow[5]).to.contain('28/07/2023')
      expect(fredMillsRow[5]).to.contain('27/07/2023')
    })
  })
})
