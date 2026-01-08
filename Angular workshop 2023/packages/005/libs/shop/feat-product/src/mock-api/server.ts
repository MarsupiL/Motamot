import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { categories, products } from './data';

const app = express();
app.use(cors())
app.listen('3000')

app.get('/products', (req: Request, resp: Response) => {
  resp.send(products);
})

app.get('/categories', (req: Request, resp: Response) => {
  resp.send(categories);
})
console.log('running mock server on port 3000');
