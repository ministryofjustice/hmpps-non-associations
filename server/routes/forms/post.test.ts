import express, { Router, type Express, type RequestHandler } from 'express'
import request, { type Response } from 'supertest'

import { BaseForm } from '../../forms'
import formPostRoute from './post'

type SampleData = {
  name: string
  surname: string
}

class SampleForm extends BaseForm<SampleData> {
  protected validate(): void {
    if (!this.data.surname) {
      this.addError('surname', 'You need to enter your surname')
    }
  }
}

/**
 * Makes a simple express app with one route that expects a form with id "sample-form"
 * and a custom request handler that tests use for expectations.
 * NB: the custom request handler will trap exceptions so shouldn't contain `expect` calls
 */
function makeApp(handler: RequestHandler): Express {
  const app = express()
  app.use(express.json())
  const router = Router()
  formPostRoute(
    router,
    '/',
    {
      'sample-form': (req, res) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore because we do not want to add fake properties to the real Express.Locals
        res.locals.formConstructed = true
        return new SampleForm()
      },
    },
    handler,
  )
  app.use(router)
  return app
}

describe('formPostRoute', () => {
  const methods = ['put', 'patch', 'delete'] as const
  it.each(methods)('disallows %s http method', method => {
    const app = makeApp((req, res) => {
      res.send('DONE')
    })
    return request(app)
      [method]('/')
      .expect(405)
      .expect((res: Response) => {
        expect(res.text).not.toEqual('DONE')
      })
  })

  it('provides form constructors with req & res', () => {
    let formConstructed = false
    const app = makeApp((req, res) => {
      formConstructed = res.locals.formConstructed
      res.send('DONE')
    })
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).toEqual('DONE')
        expect(formConstructed).toBeTruthy()
      })
  })

  it('allows handler to access all forms even when not submitted', () => {
    let submittedForm: unknown
    let forms: unknown
    const app = makeApp((req, res) => {
      submittedForm = res.locals.submittedForm
      forms = res.locals.forms
      res.send('DONE')
    })
    return request(app)
      .get('/')
      .expect(200)
      .expect(res => {
        expect(res.text).toEqual('DONE')
        expect(submittedForm).toBeNull()
        expect(Object.keys(forms)).toEqual(['sample-form'])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(forms['sample-form']).toBeInstanceOf(SampleForm)
      })
  })

  it('only allows submission with known formId', () => {
    const app = makeApp((req, res) => {
      res.send('DONE')
    })
    return request(app)
      .post('/')
      .send({ formId: 'wrong-form', surname: 'Davies' })
      .expect(400)
      .expect((res: Response) => {
        expect(res.text).not.toEqual('DONE')
      })
  })

  describe('allows handler to access submitted form', () => {
    it('when payload was valid', () => {
      let submittedForm: unknown
      const app = makeApp((req, res) => {
        submittedForm = res.locals.submittedForm
        res.send('DONE')
      })
      return request(app)
        .post('/')
        .send({ formId: 'sample-form', surname: 'Davies' })
        .expect(200)
        .expect(res => {
          expect(res.text).toEqual('DONE')
          expect(submittedForm).toBeInstanceOf(SampleForm)
          expect(submittedForm).toHaveProperty('hasErrors', false)
        })
    })

    it('when payload was invalid', () => {
      let submittedForm: unknown
      const app = makeApp((req, res) => {
        submittedForm = res.locals.submittedForm
        res.send('DONE')
      })
      return request(app)
        .post('/')
        .send({ formId: 'sample-form', name: 'John' })
        .expect(200)
        .expect(res => {
          expect(res.text).toEqual('DONE')
          expect(submittedForm).toBeInstanceOf(SampleForm)
          expect(submittedForm).toHaveProperty('hasErrors', true)
        })
    })
  })
})
