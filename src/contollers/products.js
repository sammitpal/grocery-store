import { Router } from "express";
import validations from "../utils/validateSchema.js";
import pool from "../config/db.js";
import validateToken from "../middlewares/validateToken.js";

const router = Router();

router.get('/getAllProducts', validateToken, async (req, res, next) => {
  try {
    const getProductsQuery = `SELECT * FROM product`;
    const result = await pool.query(getProductsQuery);
    if (result.rowCount > 0) {
      res.status(200).json({
        products: result.rows
      })
    } else {
      res.status(404).json({
        message: "No products found"
      })
    }
  } catch (error) {
    next(error);
  }
})
export default router