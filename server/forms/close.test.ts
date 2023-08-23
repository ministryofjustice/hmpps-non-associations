import CloseForm, { type CloseData } from './close'

describe('CloseForm', () => {
  it('should present errors when the payload is empty', () => {
    const form = new CloseForm()
    form.submit({})
    expect(form.hasErrors).toBeTruthy()
    expect(form.fields.closedReason.error).toBeTruthy()
  })

  it('should present errors when comment is empty', () => {
    const form = new CloseForm()
    form.submit({ closedReason: '' })
    expect(form.hasErrors).toBeTruthy()
    expect(form.fields.closedReason.error).toBeTruthy()
  })

  it('should accept valid payload', () => {
    const validPayload: CloseData = { closedReason: 'Problem resolved' }
    const form = new CloseForm()
    form.submit(validPayload)
    expect(form.hasErrors).toBeFalsy()
    expect(form.fields.closedReason.error).toBeFalsy()
    expect(form.fields.closedReason.value).toEqual('Problem resolved')
  })

  it('should trim whitespace from comment', () => {
    const validPayload: CloseData = { closedReason: 'Problem resolved  ' }
    const form = new CloseForm()
    form.submit(validPayload)
    expect(form.hasErrors).toBeFalsy()
    expect(form.fields.closedReason.error).toBeFalsy()
    expect(form.fields.closedReason.value).toEqual('Problem resolved')
  })

  describe('should handle long comments', () => {
    it('by allowing 240 characters', () => {
      const closedReason = '0'.repeat(240)
      const form = new CloseForm()
      form.submit({ closedReason })
      expect(form.hasErrors).toBeFalsy()
      expect(form.fields.closedReason.value).toEqual(closedReason)
    })

    it('by allowing 240 characters if the rest is whitespace', () => {
      const closedReason = '0'.repeat(240)
      const form = new CloseForm()
      form.submit({ closedReason: `${closedReason}  ` })
      expect(form.hasErrors).toBeFalsy()
      expect(form.fields.closedReason.value).toEqual(closedReason)
    })

    it('by disallowing more than 240 characters', () => {
      const closedReason = '0'.repeat(241)
      const form = new CloseForm()
      form.submit({ closedReason })
      expect(form.hasErrors).toBeTruthy()
      expect(form.fields.closedReason.error).toEqual('Comment must be 240 characters or less')
    })
  })
})
