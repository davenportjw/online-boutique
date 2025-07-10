import express from 'express';

const app = express();
const port = process.env.PORT || 3005;

app.get('/recommendations', (req, res) => {
  const productIds = req.query.product_ids as string[];
  // TODO: Implement recommendation logic
  res.json([]);
});

app.listen(port, () => {
  console.log(`Recommendation service listening at http://localhost:${port}`);
});
