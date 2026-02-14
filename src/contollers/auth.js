import { Router } from "express"; 
import pool from "../config/db.js";
import validations from "../utils/validateSchema.js";
import jwt from 'jsonwebtoken'


const router = Router();
router.post('/register',async(req,res,next) => {

  const validatedReq = validations.RegisterSchema.safeParse(req.body);
  if(!validatedReq.success){
    const error = new Error();
    error.message = validatedReq.error.issues;
    error.status = 400;

    return next(error);
  }


  const {username,email,password} = req.body;

  const checkRegisteredQuery = `SELECT * FROM USERS WHERE username = $1`;
  const checkRegisteredValues = [
    username
  ]
  const registeredUser = await pool.query(checkRegisteredQuery,checkRegisteredValues);

  if(registeredUser.rowCount>0){
    const error = new Error();
    error.message = `User ${username} is already registered. Please try to login`;
    error.status = 409;
    return next(error);
  }

  
  const registerQuery = `INSERT INTO USERS (username,email,password) values ($1,$2,$3) RETURNING *`;
  const registerValues = [
    username,
    email,
    password
  ]

  const result = await pool.query(registerQuery,registerValues);

  if(result.rows>0){
    res.json({
      message: `User ${result.rows[0].username} has been registered successfully`
    })
  }

  res.status(200).json({
    message: "User registered successfully"
  })
})

router.post('/login', async(req,res,next)=>{

      const error = new Error();

  const validatedReq = validations.LoginSchema.safeParse(req.body);
  if(!validatedReq.success){
    error.message = validatedReq.error.issues;
    error.status = 400;

    return next(error);
  }

  const {username,password} = req.body;

  const checkUserQuery = `SELECT * FROM USERS WHERE username = $1`;
  const checkUserValues = [username];

  const users = await pool.query(checkUserQuery,checkUserValues);
  if(users.rowCount===0){
    error.message = 'User not found',
    error.status = 404;

    return next(error);
  }

  if(users.rows[0].password===password){

    const payload = {
      user_id: users.rows[0].user_id,
      username: users.rows[0].username,
      email: users.rows[0].email
    }
    const token = jwt.sign(payload,process.env.JWT_SECRET,{
      expiresIn: '1h'
    })

    res.status(200).json({
      message: "Login Successful",
      token
    })
  }
  else{
    error.message = "Username or Password Invalid",
    error.status = 500
    return next(error);
  }
})
export default router