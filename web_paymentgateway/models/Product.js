import { Schema, models, model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true }, 
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 }, 
  category: String,
  image: String,
}, { timestamps: true }); 

export default models.Product || model("Product", ProductSchema);
