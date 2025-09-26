import { Schema, models, model } from "mongoose";

const PaymentSchema = new Schema(
  {
    checkoutId: { type: Schema.Types.ObjectId, ref: "Checkout" },
    invoiceId: String,
    invoiceUrl: String,
    amount: Number,
    status: String, // PENDING, PAID, EXPIRED, etc
    raw: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default models.Payment || model("Payment", PaymentSchema);
