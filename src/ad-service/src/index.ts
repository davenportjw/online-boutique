import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.get('/ads', (req, res) => {
  const ads = [
    {
      "redirect_url": "/product/0PUK6V6EV0",
      "text": "Watch our Vintage camera ad"
    },
    {
      "redirect_url": "/product/1YMWWN1N4O",
      "text": "Check out our new Telescope"
    },
    {
      "redirect_url": "/product/6E92ZMYYFZ",
      "text": "Buy the new Retro Typewriter"
    },
    {
      "redirect_url": "/product/L9ECAV7KIM",
      "text": "Vintage Record Player, now on sale!"
    }
  ];
  res.json(ads);
});

app.listen(port, () => {
  console.log(`Ad service listening at http://localhost:${port}`);
});
