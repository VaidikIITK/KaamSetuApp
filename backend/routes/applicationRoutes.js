// routes/applicationRoutes.js
// Handles: Apply, Get applicants, Accept, Reject, Withdraw
// Mount in server.js as: app.use("/api/applications", applicationRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import Application from "../models/Application.js";
import Chat from "../models/Chat.js";
import Job from "../models/Job.js";

const router = express.Router();

// ================= WORKER APPLIES TO JOB =================
// POST /api/applications/apply
// Body: { jobId, expectedPay, preferredTime }
// Called when worker clicks "Apply Now" on Live Jobs page
router.post("/apply", auth, async(req, res) => {
    try {
        const { jobId, expectedPay, preferredTime, remarks} = req.body;

        if (!jobId || !expectedPay || !preferredTime) {
            return res.status(400).json({
                message: "jobId, expectedPay and preferredTime are required",
            });
        }

        // Check job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check job is still open
        if (job.status !== "pending") {
            return res.status(400).json({ message: "This job is no longer accepting applications" });
        }

        // Check worker hasn't already applied
        const alreadyApplied = await Application.findOne({
            jobId,
            workerId: req.user.id,
        });

        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied to this job" });
        }

        // Check worker is not the poster
        if (job.posterId.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot apply to your own job" });
        }

        // Create application
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
// Called when employer clicks "View Applicants" on Account page (Figure 13)
router.get("/job/:jobId", auth, async(req, res) => {
    try {
        const { jobId } = req.params;

        // Check job exists and belongs to logged-in user
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.posterId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to view these applicants" });
        }

        // Get all applications with worker details
        const applications = await Application.find({ jobId })
            .populate("workerId", "name phone skills address")
            .sort({ createdAt: -1 });

        res.json({ applications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= GET MY APPLICATIONS (WORKER) =================
// GET /api/applications/my-applications
// Called when worker clicks "Applications" on Account page (Figure 20/21)
router.get("/my-applications", auth, async(req, res) => {
    try {
        const applications = await Application.find({ workerId: req.user.id })
            .populate("jobId", "category description address minBudget maxBudget status posterId")
            .sort({ createdAt: -1 });

        res.json({ applications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= EMPLOYER ACCEPTS A WORKER =================
// PUT /api/applications/accept/:applicationId
// Called when employer clicks "Accept" on Worker Profile page (Figure 14)
// This also:
// 1. Rejects all other applications for this job
// 2. Closes all chats for this job
// 3. Updates job status to "in-progress"
router.put("/accept/:applicationId", auth, async(req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Check job belongs to logged-in employer
        const job = await Job.findById(application.jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.posterId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // ✅ 1. Accept this application
        application.status = "accepted";
        await application.save();

        // ✅ 2. Reject ALL other applications for this job
        await Application.updateMany({
            jobId: application.jobId,
            _id: { $ne: applicationId }, // all except this one
        }, { status: "rejected" });

        // ✅ 3. Close ALL chats for this job
        await Chat.updateMany({ jobId: application.jobId }, { isActive: false });

        // ✅ 4. Update job status to in-progress
        job.status = "in-progress";
        await job.save();

        res.json({
            message: "Worker accepted successfully",
            application,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= EMPLOYER REJECTS A WORKER =================
// PUT /api/applications/reject/:applicationId
router.put("/reject/:applicationId", auth, async(req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Check job belongs to logged-in employer
        const job = await Job.findById(application.jobId);
        if (job.posterId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        application.status = "rejected";
        await application.save();

        // Close chat between this employer and worker for this job
        await Chat.updateMany({
            jobId: application.jobId,
            workerId: application.workerId,
        }, { isActive: false });

        res.json({
            message: "Application rejected",
            application,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET applications for jobs posted by current user

router.get("/received", auth, async (req, res) => {
  try {
    const userId = req.user.id; // 👈 from token

    const myJobs = await Job.find({ posterId: userId });

    const jobIds = myJobs.map((job) => job._id);

    const applications = await Application.find({
      jobId: { $in: jobIds },
    })
      .populate("jobId")
      .populate("workerId");

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= WORKER WITHDRAWS APPLICATION =================
// DELETE /api/applications/withdraw/:applicationId
router.delete("/withdraw/:applicationId", auth, async(req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Only the worker who applied can withdraw
        if (application.workerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Can only withdraw pending applications
        if (application.status !== "pending") {
            return res.status(400).json({ message: "Cannot withdraw an accepted or rejected application" });
        }

        await Application.findByIdAndDelete(applicationId);

        res.json({ message: "Application withdrawn successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;