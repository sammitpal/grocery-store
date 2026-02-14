import * as z from "zod";
import { string } from "zod/v4";

const Product = z.object({
  productName: z
    .string({
      required_error: "Product name is required",
      invalid_type_error: "Product name must be a string",
    })
    .min(3, "Product name must be at least 3 characters"),

  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .optional(),

  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0"),
})


const RegisterSchema = z.object({
  username: z.string({
    required_error: "Username is required",
    invalid_type_error: "Username must be a string",
  }).min(3, "Username must be at least 3 characters"),

  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  }).email("Invalid email address"),

  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }).min(6, "Password must be at least 6 characters"),
})

const LoginSchema = z.object({
  username: z.string({
    required_error: "Username is required",
    invalid_type_error: "Username must be a string",
  }).min(3, "Username must be at least 3 characters"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }).min(6, "Password must be at least 6 characters")

})

const validations = {
  Product,
  RegisterSchema,
  LoginSchema
}
export default validations