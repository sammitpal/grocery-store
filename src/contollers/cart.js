import { Router } from 'express';
import pool from '../config/db.js';
import validateToken from '../middlewares/validateToken.js';

const router = Router();

router.post('/addToCart', validateToken, async (req, res, next) => {

  const {productId} = parseInt(req.body);

  console.log(req.user)

  try {
    const productFromDB = await pool.query(`SELECT * FROM product WHERE product_id = $1`, [req.params.id]);
    if (productFromDB.rowCount === 0) {
      return next(new Error("Product not found"));
    }

    console.log(productFromDB.rows[0]);
    const createCartItemQuery = `INSERT INTO cart (product_id,create_dt,user_id) VALUES ($1, $2, $3) RETURNING *`;
    const values = [
      productFromDB.rows[0].product_id,
      new Date().toDateString(),
      req.user.user_id
    ]
    const result = await pool.query(createCartItemQuery, values);
    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Product added to cart"
      })
    }
  } catch (error) {
    next(error);
  }
})


router.get('/getCartItems', validateToken, async (req, res, next) => {
  try {
    const getCartItemsQuery = `SELECT c.cart_id, c.create_dt, p.product, p.description, p.sale_price FROM cart c JOIN product p ON c.product_id = p.product_id WHERE c.user_id=$1 and c.ordered=false`;
    const getCartItemsValues = [req.user.user_id]
    const result = await pool.query(getCartItemsQuery, getCartItemsValues);
    if (result.rowCount > 0) {

      res.status(200).json({
        cartItems: result.rows.map(({ description, ...rest }) => rest),
        total_cost: result.rows.reduce((sum, item) => {
          return sum + Number(item.sale_price);
        }, 0)
      })
    } else {
      res.status(404).json({
        message: "No items in cart"
      })
    }
  } catch (error) {
    next(error);
  }
})

router.delete('/removeFromCart/:id', validateToken, async (req, res, next) => {
  const cartId = parseInt(req.params.id);

  const user = req.user;
  try {
    const deleteCartItemQuery = `DELETE FROM cart WHERE cart_id = $1 AND user_id = $2 and ordered=false`;
    const deleteCartItemValues = [cartId, user.user_id];
    const result = await pool.query(deleteCartItemQuery, deleteCartItemValues);
    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Product removed from cart"
      })
    } else {
      const error = new Error("Cart item not found");
      error.status = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
})
export default router