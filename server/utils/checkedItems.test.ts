import { checkedItems, multipleCheckedItems } from './checkedItems'

describe('checkedItems nunjucks filter', () => {
  const items = [
    { text: 'A', value: 'a' },
    { text: 'B', value: 'b' },
    { text: 'C', value: 'c' },
  ]

  it('should mark a single item as checked', () => {
    expect(checkedItems(items, 'b')).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: true },
      { text: 'C', value: 'c', checked: false },
    ])
  })

  it('should mark a multiple items as checked', () => {
    expect(multipleCheckedItems(items, ['b', 'c'])).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: true },
      { text: 'C', value: 'c', checked: true },
    ])
  })

  it('should mark no items as checked when none match single value', () => {
    expect(checkedItems(items, undefined)).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: false },
      { text: 'C', value: 'c', checked: false },
    ])

    expect(checkedItems(items, 'x')).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: false },
      { text: 'C', value: 'c', checked: false },
    ])
  })

  it('should mark no items as checked when none match multiple values', () => {
    expect(multipleCheckedItems(items, undefined)).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: false },
      { text: 'C', value: 'c', checked: false },
    ])
    expect(multipleCheckedItems(items, [])).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: false },
      { text: 'C', value: 'c', checked: false },
    ])
    expect(multipleCheckedItems(items, ['x'])).toEqual([
      { text: 'A', value: 'a', checked: false },
      { text: 'B', value: 'b', checked: false },
      { text: 'C', value: 'c', checked: false },
    ])
  })
})
