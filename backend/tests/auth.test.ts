import request from 'supertest'
import { app } from '../src/app'

describe('Authentication & Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 and service health status', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('healthy')
    })
  })

  describe('POST /api/v1/auth/register', () => {
    it('should return 422 on invalid registration payload', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'A',
        email: 'invalid-email',
        password: '123',
      })
      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should return 422 when email or password is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: '',
        password: '',
      })
      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when no authorization token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })
})
