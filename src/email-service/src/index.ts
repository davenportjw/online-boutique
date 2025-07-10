import express from 'express';

const app = express();
const port = process.env.PORT || 3006;

app.use(express.json());

app.post('/email/send', (req, res) => {
  const { email, order } = req.body;
  // TODO: Implement email sending logic
  console.log(`Sending email to ${email} for order ${order.order_id}`);
  res.status(200).send();
});

app.listen(port, () => {
  console.log(`Email service listening at http://localhost:${port}`);
});
