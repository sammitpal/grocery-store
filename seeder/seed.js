import pool from "../src/config/db.js";
import fs from "fs";
import csv from "csv-parser";

function seed() {
  fs.createReadStream("/Volumes/Storage/WORK/nodejs/grocery_store/seeder/bb.csv")
    .pipe(csv())
    .on("data", (row) => {
      console.log(row);
      const { product,category,sub_category,brand,sale_price,market_price,type,rating,description } = row;
      const createProductQuery = `INSERT INTO product (product,category,sub_category,brand,sale_price,market_price,product_type,rating,description) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9) RETURNING *`;
      const values = [
        product,
        category,
        sub_category,
        brand,
        parseFloat(sale_price),
        parseFloat(market_price),
        type,
        parseFloat(rating),
        description
      ];
      pool
        .query(createProductQuery, values)
        .then((result) => {
          console.log(`Inserted product: ${result.rows[0].product}`);
        })
        .catch((err) => {
          console.error("Error inserting product:", err);
        });

    })
    .on("end", () => {
      console.log("CSV file successfully processed");
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
    });
}


seed()