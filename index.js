import express from 'express'
import product from './src/contollers/products.js'
import cart from './src/contollers/cart.js'
import auth  from './src/contollers/auth.js'
import order from './src/contollers/order.js'
import payment from './src/contollers/payments.js';
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json())

const PORT = process.env.PORT || 9090;

checkEnvVariables();

function checkEnvVariables() {
  if (!process.env.JWT_SECRET) {
    console.warn("Warning: JWT_SECRET environment variable is not set. Please set it for secure token generation.");
  }
} 

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