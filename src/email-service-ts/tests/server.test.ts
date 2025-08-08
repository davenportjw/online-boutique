import request from 'supertest';
// The app object will be created in the next step, but we import it here for the tests.
// This file will not compile until the server is implemented.
import app from '../src/server';

describe('Email Service API', () => {
  describe('POST /sendOrderConfirmation', () => {
    it('should send an order confirmation email', async () => {
      const requestBody = {
        email: 'test@example.com',
        order: {
          order_id: '12345',
          shipping_tracking_id: 'ABCDE12345',
          shipping_cost: {
            currency_code: 'USD',
            units: 10,
            nanos: 0,
          },
          shipping_address: {
            street_address: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            country: 'USA',
            zip_code: 12345,
          },
          items: [
            {
              item: {
                product_id: 'product1',
                quantity: 1,
              },
              cost: {
                currency_code: 'USD',
                units: 100,
                nanos: 0,
              },
            },
          ],
        },
      };

      const response = await request(app)
        .post('/sendOrderConfirmation')
        .send(requestBody);

      expect(response.status).toBe(200);
    });

    it('should return a 400 Bad Request for a missing "email" field', async () => {
        const requestBody = {
            order: {
              order_id: '12345',
            },
          };

          const response = await request(app)
            .post('/sendOrderConfirmation')
            .send(requestBody);

          expect(response.status).toBe(400);
    });

    it('should return a 400 Bad Request for a missing "order" field', async () => {
        const requestBody = {
            email: 'test@example.com',
          };

          const response = await request(app)
            .post('/sendOrderConfirmation')
            .send(requestBody);

          expect(response.status).toBe(400);
    });
  });
});
