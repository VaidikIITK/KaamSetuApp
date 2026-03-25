import express from "express";
import Job from "../models/Job.js"; // ✅ Remember the .js extension!
const router = express.Router();

// 🚀 Route to create a job
router.post("/create", async (req, res) => {
  try {
    const newJob = new Job(req.body);
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📋 Route to get my requests
router.get("/my-requests/:userId", async (req, res) => {
  try {
    const jobs = await Job.find({ posterId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router; // ✅ Correct way for ES Modules
