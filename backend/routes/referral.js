import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";

const router = express.Router();

// ================= GET ALL REFERRALS =================
router.get("/", auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("referrals.jobId", "category description")
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
router.post("/add", auth, async(req, res) => {
    try {
        const { workerName, workerPhone, skills, jobId } = req.body;

        if (!workerName || !workerPhone || !jobId) {
            return res.status(400).json({
                message: "Worker name, worker phone, and jobId are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ message: "Invalid jobId" });
        }

        const [user, job] = await Promise.all([
            User.findById(req.user.id),
            Job.findById(jobId),
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

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

        // prevent duplicate referral-based applications too
        const existingReferralApplication = await Application.findOne({
            jobId,
            workerPhone,
            source: "referral",
            referrerId: req.user.id,
        });

        if (existingReferralApplication) {
            return res.status(400).json({
                message: "This referred worker is already in the applicant list for this job",
            });
        }

        // if worker is already a registered user, attach workerId
        const existingWorker = await User.findOne({ phone: workerPhone }).select("_id");

        user.referrals.push({
            workerName,
            workerPhone,
            skills: skills || [],
            jobId,
        });

        await user.save();

        const createdReferral = user.referrals[user.referrals.length - 1];

        await Application.create({
            jobId,
            workerId: existingWorker ? existingWorker._id : null,
            workerName,
            workerPhone,
            skills: skills || [],
            status: "pending",
            source: "referral",
            referrerId: req.user.id,
            referralId: createdReferral._id,
        });

        const updatedUser = await User.findById(req.user.id)
            .populate("referrals.jobId", "category description")
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

        // remove matching referral-based application too
        await Application.deleteMany({
            referralId,
            referrerId: req.user.id,
            source: "referral",
        });

        user.referrals.pull({ _id: referralId });
        await user.save();

        const updatedUser = await User.findById(req.user.id)
            .populate("referrals.jobId", "category description")
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