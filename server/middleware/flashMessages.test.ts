import flash from 'connect-flash'
import cookieSession from 'cookie-session'
import express, { type Express } from 'express'
import { agent as request } from 'supertest'

import flashMessages from './flashMessages'

describe('flashMessages', () => {
  let app: Express

  beforeEach(() => {
    app = express()
    app.use(cookieSession({ signed: false, sameSite: 'none', secure: false }))
    app.use(flash())
    app.use(flashMessages())
  })

  it('should allow setting and retrieving flash messages', () => {
    app.get('/', (req, res) => {
      req.flash('information', 'Important info')
      req.flash('warning', 'Important warning')
      res.json(res.locals.messages)
    })

    return request(app)
      .get('/')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual({
          information: ['Important info'],
          warning: ['Important warning'],
        })
      })
  })

  it('should reset flash messages after access', () => {
    app.get('/', (req, res) => {
      req.flash('information', 'Important info')
      res.json(res.locals.messages)

      expect(res.locals.messages).toEqual({})
    })

    return request(app)
      .get('/')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Important info')
      })
  })

  it('should preserve messages across requests if not accessed', () => {
    app.get('/', (req, res) => {
      req.flash('information', 'Important info')
      res.redirect('/info')
    })
    app.get('/info', (req, res) => {
      res.json(res.locals.messages)
    })

    return request(app)
      .get('/')
      .redirects(1)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Important info')
      })
  })
})
