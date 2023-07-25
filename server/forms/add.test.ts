import AddForm, { type AddData, roleOptions, reasonOptions, restrictionTypeOptions } from './add'

describe('AddForm', () => {
  it('should present errors when the payload is empty', () => {
    const form = new AddForm()
    form.submit({})
    expect(form.hasErrors).toBeTruthy()
  })

  it('should present errors when a field is missing', () => {
    const validPayload: AddData = {
      prisonerRole: 'VICTIM',
      otherPrisonerRole: 'PERPETRATOR',
      reason: 'BULLYING',
      restrictionType: 'LANDING',
      comment: 'Coercion',
    }
    const enumFields = ['prisonerRole', 'otherPrisonerRole', 'reason', 'restrictionType'] as const
    enumFields.forEach(field => {
      const payload = { ...validPayload }
      delete payload[field]
      const form = new AddForm()
      form.submit(payload)
      expect(form.hasErrors).toBeTruthy()
      expect(form.fields[field].error).toBeTruthy()
    })
  })

  it('should present errors when a field is invalid', () => {
    const validPayload: AddData = {
      prisonerRole: 'NOT_RELEVANT',
      otherPrisonerRole: 'NOT_RELEVANT',
      reason: 'LEGAL_REQUEST',
      restrictionType: 'CELL',
      comment: 'Pending court case',
    }
    const enumFields = ['prisonerRole', 'otherPrisonerRole', 'reason', 'restrictionType'] as const
    enumFields.forEach(field => {
      const payload = { ...validPayload }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      payload[field] = 'INVALID'
      const form = new AddForm()
      form.submit(payload)
      expect(form.hasErrors).toBeTruthy()
      expect(form.fields[field].error).toBeTruthy()
    })
  })

  it('should accept valid payloads', () => {
    Object.keys(roleOptions).forEach(prisonerRole => {
      Object.keys(roleOptions).forEach(otherPrisonerRole => {
        Object.keys(reasonOptions).forEach(reason => {
          Object.keys(restrictionTypeOptions).forEach(restrictionType => {
            const form = new AddForm()
            form.submit({ prisonerRole, otherPrisonerRole, reason, restrictionType, comment: 'See IR 12345' })
            expect(form.hasErrors).toBeFalsy()
          })
        })
      })
    })
  })

  it('should trim whitespace from comment', () => {
    const validPayload: AddData = {
      prisonerRole: 'UNKNOWN',
      otherPrisonerRole: 'UNKNOWN',
      reason: 'GANG_RELATED',
      restrictionType: 'WING',
      comment: 'Should avoid working together  ',
    }
    const form = new AddForm()
    form.submit(validPayload)
    expect(form.hasErrors).toBeFalsy()
    expect(form.fields.comment.value).toEqual('Should avoid working together')
  })
})
