import { Schema, models, model } from "mongoose";
const ProductSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  image: String,
}, { timestamps: true });
export default models.Product || model("Product", ProductSchema);