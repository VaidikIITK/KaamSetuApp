// routes/applicationRoutes.js
// Handles: Apply, Get applicants, Accept, Reject, Withdraw, Delete, Complete
// Mount in server.js as: app.use("/api/applications", applicationRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import Application from "../models/Application.js";
import Chat from "../models/Chat.js";
import Job from "../models/Job.js";
import User from "../models/User.js"; // 👈 add this

const router = express.Router();

// ================= WORKER APPLIES TO JOB =================
// POST /api/applications/apply
// Body: { jobId, expectedPay, preferredTime, remarks }
router.post("/apply", auth, async (req, res) => {
  try {
    const { jobId, expectedPay, preferredTime, remarks } = req.body;

    if (!jobId || !expectedPay || !preferredTime) {
      return res.status(400).json({
        message: "jobId, expectedPay and preferredTime are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This job is no longer accepting applications" });
    }

    const alreadyApplied = await Application.findOne({
      jobId,
      workerId: req.user.id,
    });
    if (alreadyApplied) {
      return res
        .status(400)
        .json({ message: "You have already applied to this job" });
    }

    if (job.posterId.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot apply to your own job" });
    }

    const application = new Application({
      jobId,
      workerId: req.user.id,
      expectedPay,
      preferredTime,
      status: "pending",
      remarks,
    });

    await application.save();

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET ALL APPLICANTS FOR A JOB =================
// GET /api/applications/job/:jobId
router.get("/job/:jobId", auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.posterId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these applicants" });
    }

    const applications = await Application.find({ jobId })
      .populate("workerId", "name phone skills address")
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET MY CURRENT APPLICATIONS (WORKER) =================
// GET /api/applications/my-applications
// Returns: pending + accepted applications (active)
router.get("/my-applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({
      workerId: req.user.id,
      status: { $in: ["pending", "accepted"] },
    })
      .populate(
        "jobId",
        "category description address minBudget maxBudget status posterId",
      )
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET MY PAST APPLICATIONS (WORKER) =================
// GET /api/applications/my-past-applications
// Returns: completed + rejected applications (history)
router.get("/my-past-applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({
      workerId: req.user.id,
      status: { $in: ["completed", "rejected"] },
    })
      .populate(
        "jobId",
        "category description address minBudget maxBudget status posterId",
      )
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EMPLOYER ACCEPTS A WORKER =================
// PUT /api/applications/accept/:applicationId
router.put("/accept/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findById(application.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Accept this application
    application.status = "accepted";
    await application.save();

    // Reject all other applications for this job
    await Application.updateMany(
      { jobId: application.jobId, _id: { $ne: applicationId } },
      { status: "rejected" },
    );

    // Close all chats for this job
    await Chat.updateMany({ jobId: application.jobId }, { isActive: false });

    // Update job status to in-progress
    job.status = "in-progress";
    await job.save();

    res.json({ message: "Worker accepted successfully", application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EMPLOYER REJECTS A WORKER =================
// PUT /api/applications/reject/:applicationId
router.put("/reject/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findById(application.jobId);
    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    application.status = "rejected";
    await application.save();

    await Chat.updateMany(
      { jobId: application.jobId, workerId: application.workerId },
      { isActive: false },
    );

    res.json({ message: "Application rejected", application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= MARK APPLICATION AS COMPLETED =================
// PUT /api/applications/complete/:applicationId
// Called when the employer confirms the work is done.
// This also marks the parent job as "completed".
router.put("/complete/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Only the employer (job poster) can mark as complete
    const job = await Job.findById(application.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.posterId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the employer can mark a job as complete" });
    }

    // Application must be accepted before it can be completed
    if (application.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted applications can be marked as completed",
        current_status: application.status,
      });
    }

    // Mark the application as completed
    application.status = "completed";
    application.completedAt = new Date();
    await application.save();

    // Mark the parent job as completed too
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();

    res.json({
      message: "Job marked as completed successfully",
      application,
      job,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= WORKER WITHDRAWS/DELETES APPLICATION =================
// DELETE /api/applications/withdraw/:applicationId
// Only works for "pending" applications — cannot withdraw if accepted.
router.delete("/withdraw/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.workerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        message: "Cannot withdraw an accepted or rejected application",
      });
    }

    await Application.findByIdAndDelete(applicationId);

    res.json({ message: "Application withdrawn successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= WORKER DELETES A PAST APPLICATION (HISTORY) =================
// DELETE /api/applications/delete/:applicationId
// Allows a worker to remove rejected/completed applications from their history.
router.delete("/delete/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Only the worker who applied can delete their own history
    if (application.workerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only allow deleting completed or rejected records (past history)
    const deletableStatuses = ["completed", "rejected"];
    if (!deletableStatuses.includes(application.status)) {
      return res.status(400).json({
        message:
          "Only completed or rejected applications can be deleted. Use /withdraw to cancel a pending application.",
        current_status: application.status,
      });
    }

    await Application.findByIdAndDelete(applicationId);

    res.json({ message: "Application record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET APPLICATIONS RECEIVED (EMPLOYER VIEW) =================
// GET /api/applications/received
router.get("/received", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const myJobs = await Job.find({ posterId: userId });
    const jobIds = myJobs.map((job) => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("jobId")
      .populate("workerId");

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/applications/complete/:applicationId
router.put("/complete/:applicationId", auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    console.log("COMPLETE CALLED - rating:", rating, "review:", review); // 👈

    const application = await Application.findById(req.params.applicationId);
    console.log("Application found:", application?._id, "workerId:", application?.workerId); // 👈

    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = "completed";
    application.rating = rating;
    application.review = review;
    await application.save();

    if (rating) {
      const worker = await User.findById(application.workerId);
      console.log("Worker found:", worker?._id, "current avg:", worker?.averageRating); // 👈

      worker.ratings.push({ rating, review, givenBy: req.user.id });
      worker.totalRatings = worker.ratings.length;
      worker.averageRating =
        worker.ratings.reduce((sum, r) => sum + r.rating, 0) / worker.ratings.length;

      console.log("New averageRating:", worker.averageRating); // 👈
      await worker.save();
    }

    res.json({ message: "Work completed and rating saved!" });
  } catch (err) {
    console.log("COMPLETE ERROR:", err); // 👈
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    console.log("ME route - averageRating:", user?.averageRating); // 👈
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
