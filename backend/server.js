import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobRoutes.js"; // ✅ NEW: Import your job routes

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes); // ✅ NEW: This enables /api/jobs/create and /api/jobs/my-requests

app.get("/", (req, res) => {
  res.send("API is running...");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// Note: Using 0.0.0.0 is better for testing on your physical phone
app.listen(8000, "0.0.0.0", () => {
  console.log("Server running on port 8000");
});
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import authRoutes from "./routes/auth.js";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// // 🔥 THIS LINE MUST BE THERE
// app.use("/api/auth", authRoutes);

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });
