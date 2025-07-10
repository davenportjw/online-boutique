import express from 'express';

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

const carts: { [key: string]: any[] } = {};

app.post('/cart', (req, res) => {
  const { userId, item } = req.body;
  if (!carts[userId]) {
    carts[userId] = [];
  }
  carts[userId].push(item);
  res.status(201).send();
});

app.get('/cart/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(carts[userId] || []);
});

app.delete('/cart/:userId', (req, res) => {
  const { userId } = req.params;
  carts[userId] = [];
  res.status(204).send();
});

app.get('/cart/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.listen(port, () => {
  console.log(`Cart service listening at http://localhost:${port}`);
});