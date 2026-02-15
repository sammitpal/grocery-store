import { Router } from "express";
import pool from "../config/db.js";
import validateToken from "../middlewares/validateToken.js";
import { order_status } from "../utils/orderStatus.js";
import { payment_status } from "../utils/paymentStatus.js";
const router = Router();

router.post('/pay', validateToken, async (req, res, next) => {
  const client = await pool.connect();
  
  const user = req.user;
  
  const error = new Error();
  
  const { order_id } = req.body;
  try {
    await client.query('BEGIN')
    const getPaymentQuery = `SELECT * FROM payments where order_id = $1 and payment_status = $2 FOR UPDATE`;
    const getPaymentValues = [order_id,payment_status.PENDING];

    const getPayment = await client.query(getPaymentQuery, getPaymentValues);
    console.log(getPayment.rowCount)
    if (getPayment.rowCount === 0) {
      await client.query('ROLLBACK');
      error.message = `Invalid order id: ${order_id}`;
      error.status = 404;
      return next(error);
    }

    if (user.user_id !== getPayment.rows[0].user_id) {
      await client.query('ROLLBACK');
      error.message = `Unathorized user transaction`;
      error.status = 401;
      return next(error);
    }

    const getOrderStatusQuery = `SELECT * FROM orders where order_id = $1 and order_status = $2 FOR UPDATE`;
    const getOrderStatusValues = [order_id, order_status.PENDING];
     const orders = await client.query(getOrderStatusQuery, getOrderStatusValues);

    if (orders.rowCount === 0) {
      await client.query('ROLLBACK');
      const notFoundError = new Error(`Order ${order_id} not found or not in pending state`);
      notFoundError.status = 404;
      return next(notFoundError);
    }

    const updateOrderStatusQuery = `UPDATE ORDERS SET order_status = $1 where order_id = $2`;
    const updateOrderStatusValues = [order_status.CONFIRMED, order_id];
    await client.query(updateOrderStatusQuery, updateOrderStatusValues);



    const paymentStatusQuery = `UPDATE PAYMENTS SET payment_status = $1 where payment_id = $2`;
    const paymentStatusValues = [payment_status.PAID, getPayment.rows[0].payment_id];
    await client.query(paymentStatusQuery, paymentStatusValues);

    await client.query('COMMIT');

    res.json({ message: "Payment successful" });


  } catch (error) {
    await client.query('ROLLBACK');
    return next(error)
  } finally {
    client.release();
  }

})

export default router