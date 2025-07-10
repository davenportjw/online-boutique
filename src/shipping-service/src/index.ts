import express from 'express';

const app = express();
const port = process.env.PORT || 3002;

app.get('/shipping/cost', (req, res) => {
  const count = parseInt(req.query.count as string, 10) || 1;
  res.json({
    "cost_usd": {
      "currency_code": "USD",
      "units": 8,
      "nanos": 990000000
    }
  });
});

app.get('/shipping/quote', (req, res) => {
  res.json({
    "cost_usd": {
      "currency_code": "USD",
      "units": 8,
      "nanos": 990000000
    }
  });
});

app.listen(port, () => {
  console.log(`Shipping service listening at http://localhost:${port}`);
});
