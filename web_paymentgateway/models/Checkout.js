import mongoose, { Schema, models, model } from "mongoose";

const ItemSchema = new Schema({
  productId: String,
  name: String,
  price: Number,
  qty: Number,
});

const CheckoutSchema = new Schema(
  {
    items: [ItemSchema],
    total: { type: Number, required: true },

    payerEmail: String,

    externalId: { type: String, index: true },
    invoiceId:  { type: String, index: true }, 

    status: {
      type: String,
      enum: ["PENDING", "PAID", "EXPIRED", "FAILED", "CANCEL"],
      default: "PENDING",
      index: true,
    },
  },
  { timestamps: true }
);

export default models.Checkout || model("Checkout", CheckoutSchema);
