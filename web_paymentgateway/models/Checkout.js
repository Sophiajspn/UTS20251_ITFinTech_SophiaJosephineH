import { Schema, models, model } from "mongoose";

const ItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,     
  price: Number,    
  qty: Number,
});

const CheckoutSchema = new Schema(
  {
    items: { type: [ItemSchema], default: [] },
    total: { type: Number, required: true },

    payerEmail: { type: String, required: true },

    externalId: { type: String, index: true, sparse: true, unique: false },
    invoiceId:  { type: String, index: true, sparse: true, unique: false },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "EXPIRED", "FAILED", "CANCEL"],
      default: "PENDING",
      index: true,
    },
  },
  { timestamps: true }
);

CheckoutSchema.index({ createdAt: 1 });

export default models.Checkout || model("Checkout", CheckoutSchema);
