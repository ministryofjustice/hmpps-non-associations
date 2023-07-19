import type { Express } from 'express'
import request from 'supertest'

import applicationInfo from '../applicationInfo'
import PrisonApi from '../data/prisonApi'
import { appWithAllRoutes } from './testutils/appSetup'

jest.mock('../data/prisonApi')

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({ services: { applicationInfo: applicationInfo() } })
})

describe('site root', () => {
  it('redirects to DPS home page', () => {
    return request(app)
      .get('/')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('http://localhost:3000')
      })
  })
})

describe('prisoner photos', () => {
  let prisonApi: jest.Mocked<PrisonApi>
  beforeEach(() => {
    prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  })

  const prisonerNumber = 'A1234BC'
  const imageData = Buffer.from('image data')

  it('should return the same data as returned by prison-api', () => {
    prisonApi.getPhoto.mockResolvedValue(imageData)

    return request(app)
      .get(`/prisoner/${prisonerNumber}/photo.jpeg`)
      .expect('Content-Type', /image\/jpeg/)
      .expect(200)
      .expect(res => {
        expect(prisonApi.getPhoto).toBeCalledWith(prisonerNumber)

        expect(res.headers['cache-control']).toEqual('private, max-age=86400')
        expect(res.body).toEqual(imageData)
      })
  })

  it('should return generic image if prison-api returns 404', () => {
    prisonApi.getPhoto.mockResolvedValue(null)

    return request(app)
      .get(`/prisoner/${prisonerNumber}/photo.jpeg`)
      .expect('Content-Type', /image\/jpeg/)
      .expect(200)
      .expect(res => {
        expect(prisonApi.getPhoto).toBeCalledWith(prisonerNumber)

        expect(res.headers['cache-control']).toEqual('private, max-age=86400')
        expect(res.body).toHaveLength(3165) // file size of assets/images/prisoner.jpeg
      })
  })
})

describe('Product info', () => {
  it('should return product ID', () => {
    return request(app)
      .get('/info')
      .expect('Content-Type', /application\/json/)
      .expect(res => {
        expect(res.body).toHaveProperty('productId', 'DPS???')
      })
  })
})
