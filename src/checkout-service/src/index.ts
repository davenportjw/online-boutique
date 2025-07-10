import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3008;

app.use(express.json());

const CART_SERVICE_ADDR = process.env.CART_SERVICE_ADDR || 'http://cart-service';
const SHIPPING_SERVICE_ADDR = process.env.SHIPPING_SERVICE_ADDR || 'http://shipping-service';
const PAYMENT_SERVICE_ADDR = process.env.PAYMENT_SERVICE_ADDR || 'http://payment-service';
const EMAIL_SERVICE_ADDR = process.env.EMAIL_SERVICE_ADDR || 'http://email-service';
const CURRENCY_SERVICE_ADDR = process.env.CURRENCY_SERVICE_ADDR || 'http://currency-service';

app.post('/checkout', async (req, res) => {
  const { userId, email, credit_card } = req.body;

  try {
    const { data: cart } = await axios.get(`${CART_SERVICE_ADDR}/cart/${userId}`);
    const { data: shippingCost } = await axios.get(`${SHIPPING_SERVICE_ADDR}/shipping/cost?count=${cart.length}`);
    const { data: payment } = await axios.post(`${PAYMENT_SERVICE_ADDR}/payment/charge`, { amount: shippingCost, credit_card });
    await axios.post(`${EMAIL_SERVICE_ADDR}/email/send`, { email, order: { order_id: payment.transaction_id, shipping_cost: shippingCost, items: cart } });
    await axios.delete(`${CART_SERVICE_ADDR}/cart/${userId}`);

    res.json({ order_id: payment.transaction_id });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Checkout service listening at http://localhost:${port}`);
});
