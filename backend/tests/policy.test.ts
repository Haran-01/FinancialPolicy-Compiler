import request from 'supertest'
import { app } from '../src/app'

describe('Policy Endpoints Security', () => {
  describe('GET /api/v1/policies', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/policies')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/policies', () => {
    it('should reject unauthenticated policy creation', async () => {
      const res = await request(app).post('/api/v1/policies').send({
        name: 'LoanApproval',
        category: 'LOAN',
      })
      expect(res.status).toBe(401)
    })
  })
})
