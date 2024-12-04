import express from 'express';
import redis from 'redis';
import { promisify } from 'util';

const app = express();
const port = 1245;

const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const listProducts = [
  { itemId: 1, itemName: 'Suitcase 250', price: 50, initialAvailableQuantity: 4 },
  { itemId: 2, itemName: 'Suitcase 450', price: 100, initialAvailableQuantity: 10 },
  { itemId: 3, itemName: 'Suitcase 650', price: 350, initialAvailableQuantity: 2 },
  { itemId: 4, itemName: 'Suitcase 1050', price: 550, initialAvailableQuantity: 5 },
];

function getItemById(id) {
  return listProducts.find((item) => item.itemId === id);
}

app.get('/list_products', (req, res) => {
  res.json(listProducts);
});

app.get('/list_products/:itemId', async (req, res) => {
  const id = parseInt(req.params.itemId, 10);
  const item = getItemById(id);

  if (!item) {
    return res.json({ status: 'Product not found' });
  }

  const stock = await getAsync(`item.${id}`) || item.initialAvailableQuantity;
  res.json({ ...item, currentQuantity: parseInt(stock, 10) });
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const id = parseInt(req.params.itemId, 10);
  const item = getItemById(id);

  if (!item) {
    return res.json({ status: 'Product not found' });
  }

  const stock = await getAsync(`item.${id}`) || item.initialAvailableQuantity;

  if (stock <= 0) {
    return res.json({ status: 'Not enough stock available', itemId: id });
  }

  await setAsync(`item.${id}`, stock - 1);
  res.json({ status: 'Reservation confirmed', itemId: id });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
