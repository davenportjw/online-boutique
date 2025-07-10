import request from 'supertest';
import app from './server'; // Assuming your express app is exported from server.ts

describe('Currency Service API', () => {
  it('GET /currencies should return a list of supported currencies', async () => {
    const response = await request(app).get('/currencies');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('POST /convert should convert currency correctly', async () => {
    const response = await request(app)
      .post('/convert')
      .send({
        from: { currencyCode: 'USD', units: 100, nanos: 0 },
        toCode: 'EUR'
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('currencyCode', 'EUR');
    expect(response.body).toHaveProperty('units');
    expect(response.body).toHaveProperty('nanos');
  });

  it('POST /convert should handle invalid requests', async () => {
    const response = await request(app)
      .post('/convert')
      .send({});
    expect(response.status).toBe(400);
  });

  it('POST /convert should handle unsupported currencies', async () => {
    const response = await request(app)
      .post('/convert')
      .send({
        from: { currencyCode: 'XYZ', units: 100, nanos: 0 },
        toCode: 'EUR'
      });
    expect(response.status).toBe(400);
  });
});
