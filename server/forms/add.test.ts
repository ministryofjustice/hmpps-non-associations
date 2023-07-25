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

  describe('should handle long comments', () => {
    const validPayload: AddData = {
      prisonerRole: 'PERPETRATOR',
      otherPrisonerRole: 'VICTIM',
      reason: 'OTHER',
      restrictionType: 'LANDING',
      comment: 'COMMENT',
    }

    it('by allowing 240 characters', () => {
      const comment = '0'.repeat(240)
      const form = new AddForm()
      form.submit({ ...validPayload, comment })
      expect(form.hasErrors).toBeFalsy()
      expect(form.fields.comment.value).toEqual(comment)
    })
    it('by allowing 240 characters if the rest is whitespace', () => {
      const comment = '0'.repeat(240)
      const form = new AddForm()
      form.submit({ ...validPayload, comment: `  ${comment}  ` })
      expect(form.hasErrors).toBeFalsy()
      expect(form.fields.comment.value).toEqual(comment)
    })
    it('by disallowing more than 240 characters', () => {
      const comment = '0'.repeat(241)
      const form = new AddForm()
      form.submit({ ...validPayload, comment })
      expect(form.hasErrors).toBeTruthy()
      expect(form.fields.comment.value).toEqual(comment)
      expect(form.fields.comment.error).toEqual('Comment must be 240 characters or less')
    })
  })

  describe('should handle prisoner names', () => {
    const invalidPayload = {
      prisonerRole: 'INVALID',
      otherPrisonerRole: 'INVALID',
      reason: 'OTHER',
      restrictionType: 'LANDING',
      comment: 'COMMENT',
    }

    it('when none are provided', () => {
      const form = new AddForm()
      form.submit(invalidPayload)
      expect(form.hasErrors).toBeTruthy()
      expect(form.fields.prisonerRole.error).toEqual('Select prisoner’s role in the situation')
      expect(form.fields.otherPrisonerRole.error).toEqual('Select other prisoner’s role in the situation')
    })

    it('when they are provided', () => {
      const form = new AddForm()
      form.prisonerName = 'David Jones'
      form.otherPrisonerName = 'Fred Williams'
      form.submit(invalidPayload)
      expect(form.hasErrors).toBeTruthy()
      expect(form.fields.prisonerRole.error).toEqual('Select David Jones’ role in the situation')
      expect(form.fields.otherPrisonerRole.error).toEqual('Select Fred Williams’ role in the situation')
    })
  })
})
