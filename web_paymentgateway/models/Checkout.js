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
    
    // ✅ Data customer
    payerEmail: { type: String, required: true },
    payerPhone: { type: String }, // ✅ TAMBAH INI
    payerName: { type: String },  // ✅ TAMBAH INI
    
    // ✅ Data Xendit
    externalId: { type: String, index: true, sparse: true, unique: false },
    invoiceId:  { type: String, index: true, sparse: true, unique: false },
    invoiceUrl: { type: String }, // ✅ TAMBAH INI - untuk simpan URL payment
    
    // ✅ Status
    status: {
      type: String,
      enum: ["PENDING", "LUNAS", "PAID", "EXPIRED", "FAILED", "CANCEL"], // ✅ Tambah "LUNAS"
      default: "PENDING",
      index: true,
    },
    
    // ✅ Tracking notifikasi (mencegah double kirim WA)
    notified: {
      type: {
        checkout: { type: Boolean, default: false },
        paid: { type: Boolean, default: false },
        expired: { type: Boolean, default: false },
      },
      default: () => ({ checkout: false, paid: false, expired: false }),
    },

    paidAt: { type: Date },
  },
  { timestamps: true } 
);

CheckoutSchema.index({ createdAt: 1 });
CheckoutSchema.index({ invoiceId: 1 });
CheckoutSchema.index({ payerEmail: 1 });

export default models.Checkout || model("Checkout", CheckoutSchema);