import { convertToTitleCase, initialiseName, nameOfPerson, reversedNameOfPerson, prisonerLocation } from './utils'
import { davidJones, fredMills, joePeters, maxClarke } from '../data/testData/offenderSearch'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('display of prisoner names', () => {
  const prisoner = {
    firstName: 'DAVID',
    lastName: 'JONES',
  }

  it('normal', () => {
    expect(nameOfPerson(prisoner)).toEqual('David Jones')
  })

  it('reversed', () => {
    expect(reversedNameOfPerson(prisoner)).toEqual('Jones, David')
  })

  describe.each([
    { scenario: 'only first name', firstName: 'DAVID', expected: 'David' },
    { scenario: 'only surname', lastName: 'JONES', expected: 'Jones' },
  ])('trimming whitespace if $scenario is present', person => {
    it('normal', () => {
      expect(nameOfPerson(person as unknown as { firstName: string; lastName: string })).toEqual(person.expected)
    })

    it('reversed', () => {
      expect(reversedNameOfPerson(person as unknown as { firstName: string; lastName: string })).toEqual(
        person.expected,
      )
    })
  })
})

describe('prisoners’ locations', () => {
  it.each([davidJones, fredMills])(
    'for people who are in prison with a known cell location (e.g. $cellLocation)',
    prisoner => {
      expect(prisonerLocation(prisoner)).toEqual(prisoner.cellLocation)
    },
  )

  it('for people who are in prison without a known cell location', () => {
    const prisoner = { ...davidJones }
    delete prisoner.cellLocation
    expect(prisonerLocation(prisoner)).toEqual('Not known')
  })

  it('for people being transferred', () => {
    expect(prisonerLocation(maxClarke)).toEqual('Transfer')
  })

  it('for people being transferred without a location description', () => {
    const prisoner = { ...maxClarke }
    delete prisoner.locationDescription
    expect(prisonerLocation(prisoner)).toEqual('Transfer')
  })

  it('for people outside prison', () => {
    expect(prisonerLocation(joePeters)).toEqual('Outside - released from Moorland (HMP)')
  })

  it('for people outside prison without a location description', () => {
    const prisoner = { ...joePeters }
    delete prisoner.locationDescription
    expect(prisonerLocation(prisoner)).toEqual('Outside')
  })
})
