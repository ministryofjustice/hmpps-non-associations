import type { Express } from 'express'
import { Forbidden, Unauthorized } from 'http-errors'
import request from 'supertest'

import { appWithAllRoutes } from './routes/testutils/appSetup'

function makeApp(production: boolean, error: Error = undefined) {
  const userSupplier: () => Express.User = error
    ? () => {
        // pretend that getting user details throws an error
        throw error
      }
    : undefined
  return appWithAllRoutes({ production, userSupplier })
}

describe('Error pages', () => {
  describe('should render 404 page', () => {
    it('with stack in dev mode', () => {
      return request(makeApp(false))
        .get('/unknown')
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
          expect(res.text).toContain('NotFoundError: Not Found')
          expect(res.text).not.toContain('Sorry, there is a problem with the service')
        })
    })

    it('without stack in production mode', () => {
      return request(makeApp(true))
        .get('/unknown')
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
          expect(res.text).not.toContain('NotFoundError: Not Found')
          expect(res.text).not.toContain('Sorry, there is a problem with the service')
        })
    })
  })

  describe('should render 500 page', () => {
    it('with stack in dev mode', () => {
      return request(makeApp(false, new Error('custom error')))
        .get('/error')
        .expect(500)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with the service')
          expect(res.text).toContain('custom error')
          expect(res.text).not.toContain('Page not found')
        })
    })

    it('without stack in production mode', () => {
      return request(makeApp(true, new Error('custom error')))
        .get('/error')
        .expect(500)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with the service')
          expect(res.text).not.toContain('custom error')
          expect(res.text).not.toContain('Page not found')
        })
    })
  })

  describe.each([
    ['401 Unauthorised', new Unauthorized()],
    ['403 Forbidden', new Forbidden()],
  ])('should redirect to sign-out', (name, error) => {
    it(`if a request handler returns ${name} in dev mode`, () => {
      return request(makeApp(false, error))
        .get('/error')
        .expect(302)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    })

    it(`if a request handler returns ${name} in production`, () => {
      return request(makeApp(true, error))
        .get('/error')
        .expect(302)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    })
  })
})
