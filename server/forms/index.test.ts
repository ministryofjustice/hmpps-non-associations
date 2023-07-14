import { BaseForm, type BaseData } from './index'

describe('Form handling', () => {
  interface SimpleData extends BaseData {
    query: string
  }

  class SimpleForm extends BaseForm<SimpleData> {
    protected validate(): void {
      if (!this.data?.query) {
        this.addError('query', 'No query was submitted')
      }
    }
  }

  it('forms know their name', () => {
    const form = new SimpleForm()
    expect(`${form}`).toEqual('[SimpleForm]')
  })

  describe('unsubmitted form', () => {
    const form = new SimpleForm()

    it('knows it has not been submitted', () => {
      expect(form.submitted).toBeFalsy()
    })

    it('will allow reading field information', () => {
      expect(form.fields.query.value).toBeUndefined()
      expect(form.fields.query.error).toBeUndefined()
    })

    it('will not allow reading error information', () => {
      expect(() => form.hasErrors).toThrow('Form has not been submitted')
      expect(() => form.errors).toThrow('Form has not been submitted')
      expect(() => form.errorSummary).toThrow('Form has not been submitted')
    })
  })

  describe('submitted valid form', () => {
    const form = new SimpleForm()
    form.submit({ query: 'search text ' })

    it('knows it has been submitted', () => {
      expect(form.submitted).toBeTruthy()
    })

    it('cannot be resubmitted', () => {
      expect(() => form.submit({ query: 'search!' })).toThrow('Form has already been submitted')
    })

    it('has no errors', () => {
      expect(form.hasErrors).toBeFalsy()
    })

    it('has empty error details', () => {
      expect(form.errors).toEqual({})
    })

    it('has empty error summary', () => {
      expect(form.errorSummary).toEqual([])
    })

    it('allows retrieving known field information', () => {
      expect(form.fields.query.value).toEqual('search text ')
      expect(form.fields.query.error).toBeUndefined()
    })

    it('will return undefined for unkown fields', () => {
      expect(form.fields.missingField.value).toBeUndefined()
      expect(form.fields.missingField.error).toBeUndefined()
    })
  })

  describe('submitted invalid form', () => {
    describe.each([
      ['no payload', {}],
      ['payload but not the needed field', { search: 'help!' }],
      ['expected but invalid field', { query: '' }],
    ])('with %s', (scenario: string, payload: object) => {
      const form = new SimpleForm()
      form.submit(payload)

      it('knows it has been submitted', () => {
        expect(form.submitted).toBeTruthy()
      })

      it('cannot be resubmitted', () => {
        expect(() => form.submit({ query: 'search!' })).toThrow('Form has already been submitted')
      })

      it('has errors', () => {
        expect(form.hasErrors).toBeTruthy()
      })

      it('has non-empty error details', () => {
        expect(form.errors.query).toEqual('No query was submitted')
      })

      it('has non-empty error summary', () => {
        expect(form.errorSummary).toEqual([
          {
            text: 'No query was submitted',
            href: '#query',
          },
        ])
      })

      it('allows retrieving known field information', () => {
        expect(form.fields.query.error).toEqual('No query was submitted')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(form.fields.query.value).toEqual(payload?.query)
      })

      it('will return undefined for unkown fields', () => {
        expect(form.fields.missingField.value).toBeUndefined()
        expect(form.fields.missingField.error).toBeUndefined()
      })
    })
  })
})
