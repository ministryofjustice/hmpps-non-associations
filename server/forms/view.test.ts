import { sortByOptions, sortDirectionOptions } from '../data/nonAssociationsApi'
import ViewForm, { type ViewData } from './view'

describe('ViewForm', () => {
  const invalidScenarios: {
    scenario: string
    payload: unknown
    invalidFields: (keyof ViewData)[]
  }[] = [
    {
      scenario: 'invalid sort-by',
      payload: { sort: 'surname' },
      invalidFields: ['sort'],
    },
    {
      scenario: 'invalid sort direction',
      payload: { order: 'reversed' },
      invalidFields: ['order'],
    },
    {
      scenario: 'invalid sort direction but valid sort-by',
      payload: { sort: 'WHEN_CREATED', order: 'reversed' },
      invalidFields: ['order'],
    },
  ]
  it.each(invalidScenarios)('should not accept $scenario', ({ payload, invalidFields }) => {
    const form = new ViewForm()
    form.submit(payload)
    expect(form.hasErrors).toBeTruthy()
    invalidFields.forEach(field => expect(form.fields[field].error).toBeTruthy())
  })

  const validScenarios: {
    scenario: string
    payload: Partial<ViewData>
    expected: ViewData
  }[] = [
    {
      scenario: 'no fields are submitted',
      payload: {},
      expected: { sort: 'WHEN_CREATED', order: 'DESC' },
    },
    {
      scenario: 'only sort-by is provided',
      payload: { sort: 'LAST_NAME' },
      expected: { sort: 'LAST_NAME', order: 'DESC' },
    },
    {
      scenario: 'only sort direction is provided',
      payload: { order: 'ASC' },
      expected: { sort: 'WHEN_CREATED', order: 'ASC' },
    },
  ]
  it.each(validScenarios)('should provide fallback values when $scenario', ({ payload, expected: { sort, order } }) => {
    const form = new ViewForm()
    form.submit(payload)
    expect(form.hasErrors).toBeFalsy()
    expect(form.fields.sort.value).toEqual(sort)
    expect(form.fields.order.value).toEqual(order)
  })

  it('should accept various sorting options', () => {
    sortByOptions.forEach(sort => {
      sortDirectionOptions.forEach(order => {
        const form = new ViewForm()
        form.submit({ sort, order })
        expect(form.hasErrors).toBeFalsy()
        expect(form.fields.sort.value).toEqual(sort)
        expect(form.fields.order.value).toEqual(order)
      })
    })
  })
})
