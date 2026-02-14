// db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "sammit",
  host: "192.168.1.11",
  database: "grocery",
  password: "sammit123",
  port: 5432,
});

export default pool;
