import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const logger = pino({
  name: 'product-catalog-service-ts',
  messageKey: 'message',
  formatters: {
    level (logLevelString, logLevelNum) {
      return { severity: logLevelString }
    }
  }
});

const PORT = process.env.PORT || 3005;
const PRODUCT_CATALOG_PATH = path.join(__dirname, 'products.json');

interface Money {
    currencyCode: string;
    units: number;
    nanos: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    picture: string;
    priceUsd: Money;
    categories: string[];
}

let products: Product[] = [];

function loadProductsSync() {
    try {
        const data = require(PRODUCT_CATALOG_PATH);
        products = data.products;
    } catch (error) {
        logger.error('Failed to load products', error);
        process.exit(1);
    }
}

async function loadProducts() {
    try {
        const data = await fs.readFile(PRODUCT_CATALOG_PATH, 'utf-8');
        products = JSON.parse(data).products;
    } catch (error) {
        logger.error('Failed to load products', error);
        process.exit(1);
    }
}

app.use(express.json());

app.get('/products', (req: Request, res: Response) => {
    res.json({ products });
});

app.get('/products/search', (req: Request, res: Response) => {
    const { query } = req.query;
    if (typeof query !== 'string') {
        return res.status(400).send('Invalid query');
    }
    const results = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
    );
    res.json({ results });
});

app.get('/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).send('Product not found');
    }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

if (process.env.NODE_ENV === 'test') {
    loadProductsSync();
} else {
    loadProducts().then(() => {
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    });
}

export default app;
