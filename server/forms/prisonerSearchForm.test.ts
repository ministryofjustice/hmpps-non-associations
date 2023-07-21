import PrisonerSearchForm from './prisonerSearchForm'

describe('PrisonerSearchForm', () => {
  it.each([
    { scenario: 'the payload is empty', payload: {} },
    { scenario: 'the search query is blank', payload: { q: '', page: '1' } },
    { scenario: 'the search query only has whitespace', payload: { q: ' \t', page: '1' } },
    { scenario: 'the page is not specified', payload: { q: 'john' } },
    { scenario: 'the page is empty', payload: { q: 'john', page: '' } },
    { scenario: 'the page is 0', payload: { q: 'john', page: '0' } },
  ])('should present errors when $scenario', ({ payload }) => {
    const form = new PrisonerSearchForm()
    form.submit(payload)
    expect(form.hasErrors).toBeTruthy()
  })

  it('should accept valid payloads', () => {
    const queries = ['John', 'John Adams', 'A1409AE', 'a1409ae']
    queries.forEach((query, index) => {
      const form = new PrisonerSearchForm()
      const page = index + 1
      form.submit({ q: query, page: page.toString() })
      expect(form.hasErrors).toBeFalsy()
      expect(form.fields.q.value).toEqual(query)
      expect(form.fields.page.value).toEqual(page)
    })
  })

  it('should trim whitespace from query', () => {
    const form = new PrisonerSearchForm()
    form.submit({ q: 'A1234AA ', page: '1' })
    expect(form.hasErrors).toBeFalsy()
    expect(form.fields.q.value).toEqual('A1234AA')
  })
})
