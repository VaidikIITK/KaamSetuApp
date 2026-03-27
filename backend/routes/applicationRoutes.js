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
        const { jobId, expectedPay, preferredTime } = req.body;

        if (!jobId || !expectedPay || !preferredTime) {
            return res.status(400).json({
                message: "jobId, expectedPay and preferredTime are required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.status !== "pending") {
            return res.status(400).json({
                message: "This job is no longer accepting applications",
            });
        }

        if (job.posterId.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot apply to your own job",
            });
        }

        const alreadyApplied = await Application.findOne({
            jobId,
            workerId: req.user.id,
        });

        if (alreadyApplied) {
            return res.status(400).json({
                message: "You have already applied to this job",
            });
        }

        const application = new Application({
            jobId,
            workerId: req.user.id,
            expectedPay,
            preferredTime,
            status: "pending",
            source: "direct",
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
// Called when employer clicks "View Applicants"
router.get("/job/:jobId", auth, async(req, res) => {
    try {
        const applications = await Application.find({ jobId: req.params.jobId })
            .sort({ createdAt: -1 })
            .select(
                "_id jobId workerId workerName workerPhone skills expectedPay preferredTime status source referrerId referralId createdAt"
            );

        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ================= GET MY APPLICATIONS (WORKER) =================
// GET /api/applications/my-applications
router.get("/my-applications", auth, async(req, res) => {
    try {
        const applications = await Application.find({ workerId: req.user.id })
            .populate(
                "jobId",
                "category description address minBudget maxBudget status posterId"
            )
            .sort({ createdAt: -1 });

        res.json({ applications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= EMPLOYER ACCEPTS A WORKER =================
// PUT /api/applications/accept/:applicationId
router.put("/accept/:applicationId", auth, async(req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const job = await Job.findById(application.jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.posterId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        application.status = "accepted";
        await application.save();

        await Application.updateMany({
            jobId: application.jobId,
            _id: { $ne: applicationId },
        }, { status: "rejected" });

        await Chat.updateMany({ jobId: application.jobId }, { isActive: false });

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

        const job = await Job.findById(application.jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.posterId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        application.status = "rejected";
        await application.save();

        if (application.workerId) {
            await Chat.updateMany({
                jobId: application.jobId,
                workerId: application.workerId,
            }, { isActive: false });
        }

        res.json({
            message: "Application rejected",
            application,
        });
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

        if (!application.workerId || application.workerId.toString() !== req.user.id) {
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

export default router;