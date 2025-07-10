import express from 'express';

const app = express();
const port = process.env.PORT || 3009;

app.get('/assist', (req, res) => {
  res.json({ message: 'Sorry, I can not help you today' });
});

app.listen(port, () => {
  console.log(`Shopping assistant service listening at http://localhost:${port}`);
});
