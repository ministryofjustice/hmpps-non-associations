import express, { Router, type Express, type RequestHandler } from 'express'
import request, { type Response } from 'supertest'

import { BaseForm } from '../forms'
import formRoute from './formRoute'

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
  formRoute(
    router,
    '/',
    {
      'sample-form': () => new SampleForm(),
    },
    handler,
  )
  app.use(router)
  return app
}

describe('Form routes', () => {
  it.each(['put', 'patch', 'delete'])('disallows %s http method', (method: 'put' | 'patch' | 'delete') => {
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

  describe('allows handler to access submitted form', () => {
    it('only allows POST with known formId', () => {})

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
