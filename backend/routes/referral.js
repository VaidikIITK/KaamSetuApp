// routes/referral.js
// Handles: Add referral, Remove referral, Get all referrals
// Mount in server.js as: app.use("/api/referral", referralRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// ================= GET ALL REFERRALS =================
// GET /api/referral
// Returns all referrals of the logged-in user
router.get("/", auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("referrals.jobId", "title company")
            .select("referrals");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ referrals: user.referrals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ADD REFERRAL =================
// POST /api/referral/add
// Body: { workerName, workerPhone, skills, jobId }
router.post("/add", auth, async(req, res) => {
    try {
        const { workerName, workerPhone, skills, jobId } = req.body;

        // Basic validation
        if (!workerName || !workerPhone || !jobId) {
            return res.status(400).json({
                message: "Worker name, worker phone, and jobId are required",
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if this worker is already referred by this user for the same job
        const alreadyReferred = user.referrals.find(
            (r) =>
            r.workerPhone === workerPhone &&
            r.jobId &&
            r.jobId.toString() === jobId
        );

        if (alreadyReferred) {
            return res.status(400).json({
                message: "You have already referred this worker for this job",
            });
        }

        // Add new referral to the array
        user.referrals.push({
            workerName,
            workerPhone,
            skills: skills || [],
            jobId,
        });

        await user.save();

        const updatedUser = await User.findById(req.user.id)
            .populate("referrals.jobId", "title company")
            .select("referrals");

        res.json({
            message: "Referral added successfully",
            referrals: updatedUser.referrals,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= REMOVE REFERRAL =================
// DELETE /api/referral/remove/:referralId
// referralId is the MongoDB _id of the referral subdocument
router.delete("/remove/:referralId", auth, async(req, res) => {
    try {
        const { referralId } = req.params;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const referralExists = user.referrals.id(referralId);

        if (!referralExists) {
            return res.status(404).json({ message: "Referral not found" });
        }

        user.referrals.pull({ _id: referralId });

        await user.save();

        const updatedUser = await User.findById(req.user.id)
            .populate("referrals.jobId", "title company")
            .select("referrals");

        res.json({
            message: "Referral removed successfully",
            referrals: updatedUser.referrals,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;