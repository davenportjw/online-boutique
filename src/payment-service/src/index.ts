import express from 'express';

const app = express();
const port = process.env.PORT || 3007;

app.use(express.json());

app.post('/payment/charge', (req, res) => {
  const { amount, credit_card } = req.body;
  // TODO: Implement payment processing logic
  res.json({ transaction_id: "1234567890" });
});

app.listen(port, () => {
  console.log(`Payment service listening at http://localhost:${port}`);
});
