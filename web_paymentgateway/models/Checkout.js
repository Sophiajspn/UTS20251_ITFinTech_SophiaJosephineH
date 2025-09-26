import { Schema, models, model } from "mongoose";
const ItemSchema = new Schema({
  productId: String,
  name: String,
  price: Number,
  qty: Number,
});
const CheckoutSchema = new Schema({
  items: [ItemSchema],
  total: Number,
  status: { type: String, enum: ["PENDING","LUNAS","CANCEL"], default: "PENDING" },
}, { timestamps: true });
export default models.Checkout || model("Checkout", CheckoutSchema);