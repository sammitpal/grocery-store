import { Router } from "express";
import validateToken from "../middlewares/validateToken.js";
import pool from "../config/db.js";
import { mumble, mumbleaplha } from "node-mumble";
import { order_status } from "../utils/orderStatus.js";
import { payment_status } from "../utils/paymentStatus.js";

const router = Router();


router.post("/createOrder", validateToken, async (req, res, next) => {
  const client = await pool.connect();
  const error = new Error();
  try {

    const user = req.user;
    await client.query('BEGIN');

    const getCartItemsQuery = `SELECT * FROM cart where user_id = $1 and ordered=false FOR UPDATE`;
    const getCartItemsValues = [user.user_id];

    const cartItems = await client.query(getCartItemsQuery, getCartItemsValues);
    if (cartItems.rowCount === 0) {
      await client.query('ROLLBACK');
      error.message = "There are no Items in the cart";
      error.status = 500;
      return next(error);
    }

    const createOrderQuery = `INSERT INTO ORDERS(user_id,create_dt,order_status) values ($1,$2,$3) RETURNING order_id`;
    const createOrderValues = [user.user_id, new Date().toISOString(), order_status.PENDING];

    const createOrder = await client.query(createOrderQuery, createOrderValues);
    if(createOrder.rowCount === 0){
      await client.query('ROLLBACK');
      error.message = "Unknown Error";
      error.status = 500;
      return next(error);
    }


    const invoice = "INV" + mumble(8).toUpperCase();
    const createPaymentQuery = `INSERT INTO PAYMENTS(invoice,order_id,user_id,pay_dt,payment_status) values ($1,$2,$3,$4,$5)`;
    const createPaymentValues = [invoice, createOrder.rows[0].order_id, user.user_id, new Date().toISOString(), payment_status.PENDING];

    await client.query(createPaymentQuery, createPaymentValues);

    for (const cartItem of cartItems.rows) {

      const getProductsQuery = `SELECT * FROM product where product_id = $1`;
      const getProductValues = [cartItem.product_id];
      const product = await client.query(getProductsQuery, getProductValues);
      if (product.rowCount === 0) {
        await client.query('ROLLBACK');
        error.message = "Unknown Error";
        error.status = 500;
        return next(error);
      }

      const createOrderItemQuery = `INSERT INTO ORDER_ITEM(order_id,product_id,product_name,price) values ($1,$2,$3,$4) RETURNING *`;
      const createOrderItemValues = [createOrder.rows[0].order_id, cartItem.product_id, product.rows[0].product, product.rows[0].sale_price];

      const createdOrderItem = await client.query(createOrderItemQuery, createOrderItemValues);


      if(createdOrderItem.rowCount === 0){
        await client.query('ROLLBACK');
        error.message = "Unknown Error";
        error.status = 500;
        return next(error);
      } 

      const updateCartItemsQuery = `UPDATE CART SET ordered = true where cart_id = $1`;
      const updateCartItemsValues = [cartItem.cart_id];

      await client.query(updateCartItemsQuery, updateCartItemsValues);
    }

    await client.query('COMMIT');

    res.json({
      order_id: createOrder.rows[0].order_id,
      message: "Order Created Succssfully"
    })

  } catch (error) {
    await client.query('ROLLBACK');
    return next(error)
  }
  finally {
    client.release();
  }
})

router.post("/cancelOrder", validateToken, async (req, res, next) => {

  const { order_id } = req.body;
  const user = req.user;
  const client = await pool.connect();
  const error = new Error()

 
  try {
    await client.query('BEGIN')

    const getOrderQuery = `SELECT * FROM ORDERS WHERE user_id = $1 AND order_id = $2 AND (order_status = $3 OR order_status = $4) FOR UPDATE`;
    const getOrderValues = [user.user_id, order_id, order_status.CONFIRMED, order_status.PENDING];
    const getOrder = await client.query(getOrderQuery, getOrderValues);

    if (getOrder.rowCount === 0) {
      await client.query('ROLLBACK');
      error.message = 'This order cannot be canncelled';
      error.status = 500;
      return next(error);
    }

    if (getOrder.rows[0].user_id !== user.user_id) {
      await client.query('ROLLBACK');
      error.message = 'Unauthorized Transaction';
      error.status = 401;
      return next(error);
    }
    const updateOrderQuery = `UPDATE ORDERS SET order_status = $1 WHERE order_id = $2`;
    const updateOrderValues = [order_status.CANCELLED, order_id];
    await client.query(updateOrderQuery, updateOrderValues);


    const updatePaymentQuery = `UPDATE PAYMENTS SET payment_status = $1 WHERE order_id = $2`;
    const updatePaymentValues = [payment_status.REFUNDED, order_id];
    await client.query(updatePaymentQuery, updatePaymentValues);

    res.json({
      message: "Order has been cancelled and the amount will be refunded"
    })

    await client.query('COMMIT');

  } catch (err){
    await client.query('ROLLBACK');
    error.message = "Something went wrong";
    error.status = 500;
    return next(error)
  }
  finally{
    client.release();
  }

})

router.get("/getAllOrders", validateToken, async (req, res, next) => {
  try {
    const user = req.user;
    const getOrderQuery = `SELECT oi.order_item_id,o.order_id,oi.product_id,o.create_dt,oi.product_name,oi.price FROM order_item oi JOIN orders o ON oi.order_id = o.order_id WHERE o.user_id=$1`;
    const getOrderValues = [user.user_id];

    const orders = await pool.query(getOrderQuery, getOrderValues);
    if (orders.rowCount > 0) {
      res.json(orders.rows)
    }
    else {
      res.json([]);
    }
  } catch (error) {
    return next(error)
  }
})
router.get("/getOrderById/:id", validateToken, async (req, res, next) => {
  const id = req.params.id;
  try {
    const user = req.user;

    const getOrderQuery = `SELECT oi.order_item_id,o.order_id,oi.product_id,o.create_dt,oi.product_name,oi.price,o.order_status FROM order_item oi JOIN orders o ON oi.order_id = o.order_id WHERE o.user_id=$1 AND o.order_id=$2`;
    const getOrderValues = [user.user_id, id];
    const orders = await pool.query(getOrderQuery, getOrderValues);

    const getOrderStatusQuery = `SELECT * FROM ORDERS WHERE order_id=$1`;
    const getOrderStatusValues = [id];
    const orderStatusRes = await pool.query(getOrderStatusQuery, getOrderStatusValues);

    if (orders.rowCount > 0) {
      if (orderStatusRes.rowCount === 0) {
        const error = new Error();
        error.message = `Order ${id} not found`;
        error.status = 404;
        return next(error);
      }

      res.json({
        order_status: orderStatusRes.rows[0].order_status,
        orders: orders.rows,
        total_amount: orders.rows.reduce((sum, item) => {
          return sum + item.price
        }, 0)
      })
    }
    else {
      res.json([]);
    }
  } catch (error) {
    return next(error)
  }
})
export default router;