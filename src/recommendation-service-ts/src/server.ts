import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import axios from 'axios';

const app = express();
const logger = pino({
  name: 'recommendation-service-ts',
  messageKey: 'message',
  formatters: {
    level (logLevelString, logLevelNum) {
      return { severity: logLevelString }
    }
  }
});

const PORT = process.env.PORT || 3003;
const PRODUCT_CATALOG_SERVICE_ADDR = process.env.PRODUCT_CATALOG_SERVICE_ADDR;

interface ListRecommendationsRequest {
    user_id: string;
    product_ids: string[];
}

interface Product {
    id: string;
}

async function getProductIds() {
    if (!PRODUCT_CATALOG_SERVICE_ADDR) {
        logger.error('PRODUCT_CATALOG_SERVICE_ADDR environment variable not set');
        return [];
    }
    try {
        const response = await axios.get(`http://${PRODUCT_CATALOG_SERVICE_ADDR}/products`);
        const products = response.data.products as Product[];
        return products.map(p => p.id);
    } catch (error) {
        logger.error('Failed to get products from productcatalogservice', error);
        return [];
    }
}

app.use(express.json());

app.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { user_id, product_ids } = req.body as ListRecommendationsRequest;

    if (!user_id || !product_ids) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const allProductIds = await getProductIds();
    const maxResponses = 5;
    const filteredProducts = allProductIds.filter(id => !product_ids.includes(id));
    const numProducts = filteredProducts.length;
    const numReturn = Math.min(maxResponses, numProducts);

    const indices = [...Array(numProducts).keys()];
    const sampledIndices = [];
    for (let i = 0; i < numReturn; i++) {
        const randomIndex = Math.floor(Math.random() * indices.length);
        sampledIndices.push(indices.splice(randomIndex, 1)[0]);
    }

    const recommended_product_ids = sampledIndices.map(i => filteredProducts[i]);

    logger.info(`Recommendation request for user ${user_id} with products ${product_ids.join(', ')} resulted in ${recommended_product_ids.join(', ')}`);
    res.json({ product_ids: recommended_product_ids });
  } catch (error) {
    logger.error('Failed to get recommendations', error);
    res.status(500).json({ error: 'An unexpected error occurred during getting recommendations.' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
