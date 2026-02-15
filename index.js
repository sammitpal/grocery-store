import express from 'express'
import { rateLimit } from 'express-rate-limit'
import dotenv from "dotenv";
import helmet from 'helmet';

import product from './src/contollers/products.js'
import cart from './src/contollers/cart.js'
import auth  from './src/contollers/auth.js'
import order from './src/contollers/order.js'
import payment from './src/contollers/payments.js';

dotenv.config();

const app = express();
app.use(express.json())

const PORT = process.env.PORT || 9090;

checkEnvVariables();

function checkEnvVariables() {

  const required = ['JWT_SECRET','DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}. The application will exit.`);
    process.exit(1);
  }
}

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	limit: 50,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
})

app.use(limiter);
app.use(helmet());

app.use('/auth',auth);
app.use('/products', product);
app.use('/cart', cart);
app.use('/order',order);
app.use('/payments',payment)

app.use((req, res, next) => {
  res.status(404).send("404 not found");
});


app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    err: err.message || "Internal Server Error",
    status: err.status || 500
  })
})
app.listen(PORT, () => {
  console.log('App running on port: ', PORT)
})