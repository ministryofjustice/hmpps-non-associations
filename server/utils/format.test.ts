import format from './format'

describe('Format dates as Europe/London including time of day', () => {
  it.each([
    // same UTC offset, not DST
    ['2022-02-22T12:00:00Z', '22 February 2022, 12:00'],
    // differing UTC offset, not DST
    ['2022-02-22T12:00:00+01:00', '22 February 2022, 11:00'],

    // same UTC offset, DST
    ['2022-06-22T12:00:00Z', '22 June 2022, 13:00'],
    // differing UTC offset, DST
    ['2022-06-22T12:00:00+01:00', '22 June 2022, 12:00'],

    // near DST switch
    ['2021-10-30T23:59:59Z', '31 October 2021, 00:59'],
    ['2021-10-31T00:00:00Z', '31 October 2021, 01:00'],
    ['2021-10-31T00:00:01Z', '31 October 2021, 01:00'],
    ['2021-10-31T00:59:59Z', '31 October 2021, 01:59'],
    ['2021-10-31T01:00:00Z', '31 October 2021, 01:00'],
    ['2021-10-31T01:00:01Z', '31 October 2021, 01:00'],

    // 24-hr clock
    ['2022-02-23T16:37:53Z', '23 February 2022, 16:37'],
  ])('new Date(%s) should format as %s', (date, expected) => {
    expect(format.dateAndTime(new Date(date))).toEqual(expected)
  })

  it('should handle null and undefined', () => {
    expect(format.dateAndTime(null)).toEqual('')
    expect(format.dateAndTime(undefined)).toEqual('')
  })
})

describe('Format dates as Europe/London ignoring time-of-day', () => {
  it.each([
    // same UTC offset, not DST
    ['2022-02-22T12:00:00Z', '22 February 2022'],
    // differing UTC offset, not DST
    ['2022-02-22T12:00:00+01:00', '22 February 2022'],

    // same UTC offset, DST
    ['2022-06-22T12:00:00Z', '22 June 2022'],
    // differing UTC offset, DST
    ['2022-06-22T12:00:00+01:00', '22 June 2022'],

    // near DST switch
    ['2021-10-30T23:59:59Z', '31 October 2021'],
    ['2021-10-31T00:00:00Z', '31 October 2021'],
    ['2021-10-31T00:00:01Z', '31 October 2021'],
    ['2021-10-31T00:59:59Z', '31 October 2021'],
    ['2021-10-31T01:00:00Z', '31 October 2021'],
    ['2021-10-31T01:00:01Z', '31 October 2021'],

    // 24-hr clock
    ['2022-02-23T16:37:53Z', '23 February 2022'],
  ])('new Date(%s) should format as %s ignoring time-of-day', (date, expected) => {
    expect(format.date(new Date(date))).toEqual(expected)
  })

  it('should handle null and undefined', () => {
    expect(format.date(null)).toEqual('')
    expect(format.date(undefined)).toEqual('')
  })
})

describe('Format shorts dates as Europe/London ignoring time-of-day', () => {
  it.each([
    // same UTC offset, not DST
    ['2022-02-22T12:00:00Z', '22/02/2022'],
    // differing UTC offset, not DST
    ['2022-02-22T12:00:00+01:00', '22/02/2022'],

    // same UTC offset, DST
    ['2022-06-22T12:00:00Z', '22/06/2022'],
    // differing UTC offset, DST
    ['2022-06-22T12:00:00+01:00', '22/06/2022'],

    // near DST switch
    ['2021-10-30T23:59:59Z', '31/10/2021'],
    ['2021-10-31T00:00:00Z', '31/10/2021'],
    ['2021-10-31T00:00:01Z', '31/10/2021'],
    ['2021-10-31T00:59:59Z', '31/10/2021'],
    ['2021-10-31T01:00:00Z', '31/10/2021'],
    ['2021-10-31T01:00:01Z', '31/10/2021'],

    // 24-hr clock
    ['2022-02-23T16:37:53Z', '23/02/2022'],
  ])('new Date(%s) should format as %s ignoring time-of-day', (date, expected) => {
    expect(format.shortDate(new Date(date))).toEqual(expected)
  })

  it('should handle null and undefined', () => {
    expect(format.shortDate(null)).toEqual('')
    expect(format.shortDate(undefined)).toEqual('')
  })
})

describe.each([
  [0, '0'],
  [1, '1'],
  [123, '123'],
  [1234, '1,234'],
  [12345, '12,345'],
  [12345678, '12,345,678'],
  [-1, '-1'],
  [-1234, '-1,234'],
  [Math.PI, '3'],
  [12345.62, '12,346'],
  [NaN, '?'],
  [undefined, '?'],
  [null, '?'],
])('Format integers with thousands separator', (n: number, expected: string) => {
  it(`${n} formats as ${expected}`, () => {
    expect(format.thousands(n)).toEqual(expected)
  })
})

describe.each([
  ['David', 'David’s'],
  ['Jones', 'Jones’'],
  ['DAVID', 'DAVID’s'],
  ['JONES', 'JONES’'],
  ['David Jones', 'David Jones’'],
  ['DAVID JONES', 'DAVID JONES’'],
])('Format possessive forms of names', (name: string, expected: string) => {
  it(`${name} becomes ${expected}`, () => {
    expect(format.possessiveName(name)).toEqual(expected)
  })
})
