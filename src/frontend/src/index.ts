import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

const PRODUCT_CATALOG_SERVICE_ADDR = process.env.PRODUCT_CATALOG_SERVICE_ADDR || 'http://product-catalog-service';
const AD_SERVICE_ADDR = process.env.AD_SERVICE_ADDR || 'http://ad-service';

app.get('/', async (req, res) => {
  try {
    const { data: products } = await axios.get(`${PRODUCT_CATALOG_SERVICE_ADDR}/products`);
    const { data: ads } = await axios.get(`${AD_SERVICE_ADDR}/ads`);
    res.send(`
      <h1>Online Boutique</h1>
      <h2>Products</h2>
      <ul>
        ${products.map((p: any) => `<li>${p.name}</li>`).join('')}
      </ul>
      <h2>Ads</h2>
      <ul>
        ${ads.map((a: any) => `<li>${a.text}</li>`).join('')}
      </ul>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Frontend listening at http://localhost:${port}`);
});
