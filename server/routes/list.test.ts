import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { transferPrisonId, outsidePrisonId } from '../data/constants'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones1ClosedNonAssociation,
  davidJones2ClosedNonAssociations,
  mockMovePrisonerInNonAssociationsList,
  mockMoveOtherPrisonersInNonAssociationsList,
} from '../data/testData/nonAssociationsApi'
import { davidJones, mockMovePrisoner } from '../data/testData/offenderSearch'
import { mockGetStaffDetails } from '../data/testData/prisonApi'
import { Table } from './list'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nonAssociationsApi', () => {
  // ensures that constants are preserved
  type Module = typeof import('../data/nonAssociationsApi')
  const realModule = jest.requireActual<Module>('../data/nonAssociationsApi')
  const mockedModule = jest.createMockFromModule<Module>('../data/nonAssociationsApi')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch', () => {
  // ensures that constants and functions are preserved
  type Module = typeof import('../data/offenderSearch')
  const realModule = jest.requireActual<Module>('../data/offenderSearch')
  const mockedModule = jest.createMockFromModule<Module>('../data/offenderSearch')
  return { __esModule: true, ...realModule, OffenderSearchClient: mockedModule.OffenderSearchClient }
})
jest.mock('../data/prisonApi')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>
let prisonApi: jest.Mocked<PrisonApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  offenderSearchClient.getPrisoner.mockResolvedValue(prisoner)
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Non-associations list page', () => {
  describe('should return 404 if prisoner is not found', () => {
    beforeEach(() => {
      const error: SanitisedError = {
        name: 'Error',
        status: 404,
        message: 'Not Found',
        stack: 'Not Found',
      }
      offenderSearchClient.getPrisoner.mockRejectedValue(error)
    })

    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain('Jones, David')
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain('Jones, David')
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
        })
    })
  })

  describe('should show key prisoner location', () => {
    beforeEach(() => {
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    describe('when they’re being transferred', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, transferPrisonId))
      })

      it('when listing open non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1OpenNonAssociation, transferPrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Transfer')
          })
      })

      it('when listing closed non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1ClosedNonAssociation, transferPrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber, true))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Transfer')
          })
      })
    })

    describe('when they’re outside prison', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))
      })

      it('when listing open non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1OpenNonAssociation, outsidePrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Outside - released from Moorland (HMP)')
          })
      })

      it('when listing closed non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1ClosedNonAssociation, outsidePrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber, true))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Outside - released from Moorland (HMP)')
          })
      })
    })
  })

  describe('adding a new non-association', () => {
    beforeEach(() => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)
    })

    it.each([
      {
        scenario: 'in prison',
        keyPrisoner: prisoner,
      },
      {
        scenario: 'being transferred',
        keyPrisoner: mockMovePrisoner(prisoner, transferPrisonId),
      },
    ])('for prisoners who are $scenario should be allowed', ({ keyPrisoner }) => {
      offenderSearchClient.getPrisoner.mockResolvedValueOnce(keyPrisoner)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Add new non-association')
          expect(res.text).toContain(`${prisonerNumber}/non-associations/add/search-prisoner`)
        })
    })

    it('for prisoners who are outside should not be allowed', () => {
      offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Add new non-association')
          expect(res.text).not.toContain(`${prisonerNumber}/non-associations/add/search-prisoner`)
        })
    })
  })

  describe('listing non-associations for a prisoner', () => {
    beforeEach(() => {
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    class ExpectNonAssociationList {
      private table: Table

      // eslint-disable-next-line no-empty-function
      constructor(private readonly closed = false) {}

      shouldHaveThreeGroups(table: 'same' | 'other' | 'outside'): request.Test {
        this.table = table

        return request(app)
          .get(routeUrls.list(prisonerNumber, this.closed))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            // headings
            expect(res.text).toContain('Moorland (HMP)</h2>') // otherwise case load switcher matches
            expect(res.text).toContain('Other establishments')
            expect(res.text).not.toContain('In establishments')
            expect(res.text).toContain('Not currently in an establishment')

            this.shouldShowTable(res)
            this.shouldShowMessages(res, ['same', 'other', 'outside'])
          })
      }

      shouldHaveTwoGroups(table: 'any' | 'outside'): request.Test {
        this.table = table

        return request(app)
          .get(routeUrls.list(prisonerNumber, this.closed))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            // headings
            expect(res.text).not.toContain('Moorland (HMP)</h2>') // otherwise case load switcher matches
            expect(res.text).not.toContain('Other establishments')
            expect(res.text).toContain('In establishments')
            expect(res.text).toContain('Not currently in an establishment')

            this.shouldShowTable(res)
            this.shouldShowMessages(res, ['any', 'outside'])
          })
      }

      private shouldShowTable(res: request.Response) {
        expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)

        // staff lookups
        if (!this.closed) {
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')
        } else {
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
        }

        // table
        expect(res.text).toContain('app-sortable-table')
        expect(res.text).toContain('Mills, Fred')
        expect(res.text).toContain('Perpetrator')
        expect(res.text).not.toContain('Victim')
        expect(res.text).toContain('Jones, Oscar')
        expect(res.text).toContain('Not relevant')
        expect(res.text).toContain('Cell and landing')
        if (this.table === 'same') {
          expect(res.text).toContain('1-1-002')
          expect(res.text).toContain('1-1-003')
        }
        if (!this.closed) {
          expect(res.text).toContain('26/07/2023')
        } else {
          expect(res.text).not.toContain('26/07/2023')
          expect(res.text).toContain('27/07/2023')
        }
        expect(res.text).toContain('Actions')
      }

      private shouldShowMessages(res: request.Response, tables: ExpectNonAssociationList['table'][]) {
        const messages: { message: string; closed: boolean; table: ExpectNonAssociationList['table'] }[] = [
          {
            message: 'David Jones has no open non-associations in Moorland (HMP)',
            closed: false,
            table: 'same',
          },
          {
            message: 'David Jones has no closed non-associations in Moorland (HMP)',
            closed: true,
            table: 'same',
          },
          {
            message: 'David Jones has no open non-associations in other establishments',
            closed: false,
            table: 'other',
          },
          {
            message: 'David Jones has no closed non-associations in other establishments',
            closed: true,
            table: 'other',
          },
          {
            message: 'David Jones has no open non-associations in an establishment',
            closed: false,
            table: 'any',
          },
          {
            message: 'David Jones has no closed non-associations in an establishment',
            closed: true,
            table: 'any',
          },
          {
            message: 'David Jones has no open non-associations outside an establishment',
            closed: false,
            table: 'outside',
          },
          {
            message: 'David Jones has no closed non-associations outside an establishment',
            closed: true,
            table: 'outside',
          },
        ]

        for (const { message, closed, table } of messages) {
          if (closed !== this.closed) {
            // all messages from opposite tab should not show
            expect(res.text).not.toContain(message)
          } else if (table === this.table) {
            // the table that's expected won't have a message
            expect(res.text).not.toContain(message)
          } else if (tables.includes(table)) {
            // other tables on the same page will have the message
            expect(res.text).toContain(message)
          } else {
            expect(res.text).not.toContain(message)
          }
        }
      }
    }

    describe('when they are in a prison', () => {
      describe('should show open ones', () => {
        it('in the same prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)

          return new ExpectNonAssociationList().shouldHaveThreeGroups('same')
        })

        it('in other prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2OpenNonAssociations, 'LEI', 'Leeds (HMP)'),
          )

          return new ExpectNonAssociationList().shouldHaveThreeGroups('other')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList().shouldHaveThreeGroups('outside')
        })
      })

      describe('should show closed ones', () => {
        it('in the same prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2ClosedNonAssociations)

          return new ExpectNonAssociationList(true).shouldHaveThreeGroups('same')
        })

        it('in other prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2ClosedNonAssociations, 'LEI', 'Leeds (HMP)'),
          )

          return new ExpectNonAssociationList(true).shouldHaveThreeGroups('other')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2ClosedNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList(true).shouldHaveThreeGroups('outside')
        })
      })
    })

    describe('when they are being transferred', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, transferPrisonId))
      })

      describe('should show open ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, transferPrisonId),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, transferPrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('outside')
        })
      })

      describe('should show closed ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, transferPrisonId),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, transferPrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('outside')
        })
      })
    })

    describe('when they are outside prison', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))
      })

      describe('should show open ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('outside')
        })
      })

      describe('should show closed ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, outsidePrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('outside')
        })
      })
    })
  })

  describe('should show count of non-associations in tabs', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)

          expect(res.text).toContain('Open (2 records)')
          expect(res.text).toContain('Closed (0 records)')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2ClosedNonAssociations)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)

          expect(res.text).toContain('Open (1 record)')
          expect(res.text).toContain('Closed (2 records)')
        })
    })
  })

  describe('should call api asking for sorted non-associations with most recently updated first', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1OpenNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            includeOpen: true,
            includeClosed: false,
            includeOtherPrisons: true,
            sortBy: 'WHEN_UPDATED',
            sortDirection: 'DESC',
          })
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1ClosedNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            includeOpen: false,
            includeClosed: true,
            includeOtherPrisons: true,
            sortBy: 'WHEN_UPDATED',
            sortDirection: 'DESC',
          })
        })
    })
  })

  describe('should show an error mesage in the unlikely event of sort options being invalid', () => {
    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .query({ sort: 'age' })
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          expect(res.text).toContain('There is a problem')
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .query({ sort: 'age' })
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          expect(res.text).toContain('There is a problem')
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })

  describe('should display look up staff usernames (despite not being presented)', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2OpenNonAssociations,
        nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map((nonAssociation, index) => {
          const authorisedBy = index === 1 ? 'NON_ASSOCIATIONS_API' : nonAssociation.authorisedBy
          return {
            ...nonAssociation,
            authorisedBy,
            updatedBy: authorisedBy,
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('NON_ASSOCIATIONS_API')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2ClosedNonAssociations,
        nonAssociations: davidJones2ClosedNonAssociations.nonAssociations.map((nonAssociation, index) => {
          const authorisedBy = index === 1 ? 'NON_ASSOCIATIONS_API' : nonAssociation.authorisedBy
          return {
            ...nonAssociation,
            authorisedBy,
            updatedBy: authorisedBy,
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('NON_ASSOCIATIONS_API')
        })
    })
  })

  describe('should only look up unique staff usernames (despite not being presented)', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2OpenNonAssociations,
        nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'abc12a',
            updatedBy: 'abc12a',
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2ClosedNonAssociations,
        nonAssociations: davidJones2ClosedNonAssociations.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'abc12a',
            updatedBy: 'abc12a',
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
        })
    })
  })

  describe('should show a message when there are no non-associations at all', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('David Jones has no open non-associations')
          expect(res.text).not.toContain('David Jones has no open non-associations in Moorland (HMP)')
          expect(res.text).not.toContain('David Jones has no open non-associations in other establishments')
          expect(res.text).not.toContain('David Jones has no open non-associations outside an establishment')
          expect(res.text).not.toContain('David Jones has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('David Jones has no closed non-associations')
          expect(res.text).not.toContain('David Jones has no closed non-associations in Moorland (HMP)')
          expect(res.text).not.toContain('David Jones has no closed non-associations in other establishments')
          expect(res.text).not.toContain('David Jones has no closed non-associations outside an establishment')
          expect(res.text).not.toContain('David Jones has no open non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })

  describe('should show generic error page when api returns an error', () => {
    beforeEach(() => {
      const error: SanitisedError = {
        name: 'Error',
        status: 500,
        message: 'Internal Server Error',
        stack: 'Error: Internal Server Error',
      }
      nonAssociationsApi.listNonAssociations.mockRejectedValue(error)
    })

    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('Non-associations could not be loaded')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('Non-associations could not be loaded')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })
})
