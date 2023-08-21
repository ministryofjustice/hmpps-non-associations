export type BaseData = Record<string, unknown>

/**
 * Base form providing simple validation extension points and per-field error messages
 */
export abstract class BaseForm<Data extends BaseData> {
  /**
   * Posted form data, undefined indicates that the form has not been submitted/POSTed
   * NB: it may be transformed in place by validation
   */
  protected data?: Partial<Data>

  /**
   * Holds per-field error messages
   */
  private readonly fieldErrors: Partial<Record<keyof Data, string>>

  constructor() {
    this.fieldErrors = {}
  }

  public toString(): string {
    return `[${this.constructor.name}]`
  }

  /**
   * Load data into the form without triggering the validation
   */
  public load(data: { [K in keyof Data]?: string }): void {
    if (this.submitted) {
      throw new Error('Form has already been submitted')
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Submitted data must be an object')
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because data has not yet been validated and turned into the expected type
    this.data = data
  }

  /**
   * Set the submitted/POSTed form data triggering validation
   */
  public submit(data: { [K in keyof Data]?: string }): void {
    this.load(data)
    this.validate()
  }

  /**
   * Whether the form was submitted/POSTed or is blank
   */
  public get submitted(): boolean {
    return typeof this.data !== 'undefined'
  }

  /**
   * Used inside methods that require a submitted form
   */
  protected requireSubmission(): void {
    if (!this.submitted) {
      throw new Error('Form has not been submitted')
    }
  }

  /**
   * Extension point: subclasses perform validation and manupulation of `this.data`
   */
  protected abstract validate(): void

  /**
   * Subclasses set errors on fields
   */
  protected addError(field: keyof Data, error: string): void {
    this.fieldErrors[field] = error
  }

  /**
   * Whether the form has validation errors. Will be false if not submitted
   */
  public get hasErrors(): boolean {
    this.requireSubmission()
    return Object.keys(this.fieldErrors).length > 0
  }

  /**
   * Field information: value if submitted and error message if any.
   * Note that errors will always be undefined before the form was submitted
   */
  public get fields(): {
    readonly [T in keyof Data]: {
      readonly value: Data[T]
      readonly error?: string
    }
  } {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new Proxy(this, {
      get(target: BaseForm<Data>, field: string) {
        const fieldDetails: {
          value: Data[string]
          error?: string
        } = {
          value: target.data?.[field],
        }
        if (target.fieldErrors[field]) {
          fieldDetails.error = target.fieldErrors[field]
        }
        return fieldDetails
      },
    })
  }

  /**
   * Map of field name-error pairs for all errors.
   * Will always be an empty object before the form is submitted
   */
  public get errors(): Readonly<Partial<Record<keyof Data, string>>> {
    this.requireSubmission()
    return { ...this.fieldErrors }
  }

  /**
   * Used for the `errorList` property of the GOV.UK error summary component
   */
  public getErrorSummary(formId?: string): {
    readonly text: string
    readonly href: string
  }[] {
    const errorsList = Object.entries(this.errors) as [keyof Data, string][]
    return errorsList.map(([field, error]) => {
      const href = formId ? `#${formId}-${field.toString()}` : `#${field.toString()}`
      return { text: error, href }
    })
  }
}
