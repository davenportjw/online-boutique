import request from 'supertest';
// The app object will be created in the next step, but we import it here for the tests.
// This file will not compile until the server is implemented.
import app from '../src/server';

describe('Product Catalog Service API', () => {
  describe('GET /products', () => {
    it('should return a list of all products', async () => {
      const response = await request(app).get('/products');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('GET /products/{id}', () => {
    it('should return a single product for a valid id', async () => {
      const productId = 'OLJCESPC7Z'; // A known product id from the catalog
      const response = await request(app).get(`/products/${productId}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', productId);
    });

    it('should return a 404 for an invalid product id', async () => {
      const productId = 'invalid-id';
      const response = await request(app).get(`/products/${productId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /products/search', () => {
    it('should return a list of products that match the search query', async () => {
      const query = 'mug';
      const response = await request(app).get(`/products/search?query=${query}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });
});
