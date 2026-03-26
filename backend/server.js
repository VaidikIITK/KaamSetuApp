import "./config.js";
// import mongoose from "mongoose";
// import authRoutes from "./routes/auth.js";
// import cors from "cors";
// import express from "express";
import dns from 'dns';
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// server.js — updated with all routes
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js"; // ✅ NEW
import chatRoutes from "./routes/chat.js"; // ✅ NEW
import referralRoutes from "./routes/referral.js";


const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes); // ✅ NEW
app.use("/api/chat", chatRoutes); // ✅ NEW
app.use("/api/referral", referralRoutes);

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
    res.send("API is running...");
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log(err));

app.listen(8030, "0.0.0.0", () => {
    console.log("Server running on port 8030");
});
