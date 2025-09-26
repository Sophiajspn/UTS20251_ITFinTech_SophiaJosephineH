import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export default async function handler(req, res) {

  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ ok:false, error:"Seed disabled in production" });
  }
  if (req.method !== "POST") return res.status(405).end();

  try {
    await connectDB();

    await Product.deleteMany({});

    await Product.insertMany([
      {
        name: "pancake",
        category: "dessert",
        price: 35000,
        image: "https://cdn.loveandlemons.com/wp-content/uploads/2025/01/pancake-recipe-1024x1024.jpg",
      },
      {
        name: "Milkshake",
        category: "Dairy",
        price: 25000,
        image: "https://www.foodandwine.com/thmb/CDUm_prngHc8fvrk3_EStSqmmq4=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Black-and-White-Milkshake-FT-MAG-RECIPE-0325-c41193710f4944d6a19ecbd8498e6850.jpg",
      },
      {
        name: "Cookies",
        category: "dessert",
        price: 10000,
        image: "https://www.recipetineats.com/tachyon/2025/03/The-Chocolate-Chip-Cookie-of-my-dreams-_2.jpg?resize=1200%2C1500&zoom=0.54",
      },
    ]);

    res.json({ ok: true, seeded: 3 });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
}
