import express from 'express';
import products from './products.json';

const app = express();
const port = process.env.PORT || 3004;

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).send('Product not found');
  }
});

app.listen(port, () => {
  console.log(`Product catalog service listening at http://localhost:${port}`);
});
