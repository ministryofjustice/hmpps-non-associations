// eslint-disable-next-line max-classes-per-file
import { BaseForm, type BaseData } from './index'

describe('Form handling', () => {
  interface SimpleData extends BaseData {
    query: string
  }

  class SimpleForm extends BaseForm<SimpleData> {
    protected validate(): void {
      if (!this.data.query) {
        this.addError('query', 'No query was submitted')
      } else {
        this.data.query = this.data.query.trim()
        if (this.data.query === '') {
          this.addError('query', 'Blank query was submitted')
        }
      }
    }
  }

  it('forms know their name', () => {
    const form = new SimpleForm()
    expect(`${form}`).toEqual('[SimpleForm]')
  })

  it('forms require object as submitted payload', () => {
    const invalidPayloads: unknown[] = [undefined, null, true, '', () => {}]
    invalidPayloads.forEach(payload => {
      const form = new SimpleForm()
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        form.submit(payload)
      }).toThrow('Submitted data must be an object')
    })
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
      expect(() => form.getErrorSummary()).toThrow('Form has not been submitted')
    })
  })

  describe('loading data into a form', () => {
    const form = new SimpleForm()
    form.load({ query: ' ' })

    it('it doesn’t have errors', () => {
      expect(form.hasErrors).toBeFalsy()
    })

    it('contains the loaded, unsanitised fields', () => {
      expect(form.fields.query.value).toEqual(' ')
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
      expect(form.getErrorSummary()).toEqual([])
    })

    it('allows retrieving known field information', () => {
      expect(form.fields.query.value).toEqual('search text')
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
        expect(form.getErrorSummary()).toEqual([
          {
            text: 'No query was submitted',
            href: '#query',
          },
        ])
        expect(form.getErrorSummary('helpForm')).toEqual([
          {
            text: 'No query was submitted',
            href: '#helpForm-query',
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

  describe('with non-string data', () => {
    interface NonStringData extends BaseData {
      n: number
      b: boolean
    }

    class NonStringForm extends BaseForm<NonStringData> {
      protected validate(): void {
        this.data.n = parseInt(this.data.n as unknown as string, 10)
        if (Number.isNaN(this.data.n) || this.data.n < 1) {
          this.addError('n', 'Not a number')
          delete this.data.n
        }

        this.data.b = (this.data.b as unknown) === 'true'
      }
    }

    it('allows conversion from string inputs', () => {
      const form = new NonStringForm()
      form.submit({ n: '123', b: 'true' })
      expect(form.hasErrors).toBeFalsy()
      expect(form.fields.n.value).toEqual(123)
      expect(form.fields.b.value).toEqual(true)
    })
  })
})
