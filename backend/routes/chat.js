// routes/chat.js
// Mount in server.js as:
// app.use("/api/chat", chatRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import Application from "../models/Application.js";
import Chat from "../models/Chat.js";
import Job from "../models/Job.js";

const router = express.Router();

// ================= CREATE OR GET CHAT =================
// POST /api/chat/create
// Body: { jobId, workerId, applicationId }
router.post("/create", auth, async(req, res) => {
    try {
        const { jobId, workerId, applicationId } = req.body;

        if (!jobId || !workerId || !applicationId) {
            return res.status(400).json({
                message: "jobId, workerId and applicationId are required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Ensure application belongs to this job
        if (application.jobId ? .toString() !== jobId.toString()) {
            return res.status(400).json({
                message: "Application does not belong to this job",
            });
        }

        // Ensure application belongs to this worker
        if (application.workerId ? .toString() !== workerId.toString()) {
            return res.status(400).json({
                message: "Application does not belong to this worker",
            });
        }

        // Use posterId from the job itself so both sides refer to the same chat
        const posterId = job.posterId ? .toString();
        if (!posterId) {
            return res.status(400).json({ message: "Job poster not found" });
        }

        // Only job poster or assigned worker can create/open this chat
        const isAllowedUser =
            req.user.id === posterId || req.user.id === workerId.toString();

        if (!isAllowedUser) {
            return res.status(403).json({
                message: "Not authorized to create or open this chat",
            });
        }

        // Find exact existing chat first
        let chat = await Chat.findOne({
            jobId,
            workerId,
            applicationId,
            posterId,
            isActive: true,
        });

        if (chat) {
            return res.json({
                message: "Chat already exists",
                chat,
            });
        }

        // Create new chat
        chat = new Chat({
            jobId,
            posterId,
            workerId,
            applicationId,
            isActive: true,
            messages: [],
        });

        await chat.save();

        return res.status(201).json({
            message: "Chat created successfully",
            chat,
        });
    } catch (err) {
        console.error("CREATE CHAT ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ================= SEND MESSAGE =================
// POST /api/chat/:chatId/send
// Body: { content }
router.post("/:chatId/send", auth, async(req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const isParticipant =
            chat.posterId.toString() === req.user.id ||
            chat.workerId.toString() === req.user.id;

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized to send message in this chat",
            });
        }

        if (!chat.isActive) {
            return res.status(400).json({ message: "This chat has been closed" });
        }

        chat.messages.push({
            senderId: req.user.id,
            content: content.trim(),
            readStatus: false,
            createdAt: new Date(),
        });

        await chat.save();

        return res.json({
            message: "Message sent",
            messages: chat.messages.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            ),
        });
    } catch (err) {
        console.error("SEND MESSAGE ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ================= GET MY CHATS =================
// GET /api/chat/my-chats
router.get("/my-chats", auth, async(req, res) => {
    try {
        const chats = await Chat.find({
                $or: [{ posterId: req.user.id }, { workerId: req.user.id }],
                isActive: true,
            })
            .populate("workerId", "name phone skills")
            .populate("posterId", "name phone")
            .populate("jobId", "category description address")
            .sort({ updatedAt: -1, createdAt: -1 });

        return res.json({ chats });
    } catch (err) {
        console.error("GET MY CHATS ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ================= GET ALL MESSAGES =================
// GET /api/chat/:chatId/messages
router.get("/:chatId/messages", auth, async(req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findById(chatId)
            .populate("posterId", "name phone")
            .populate("workerId", "name phone skills")
            .populate("jobId", "category description address");

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const posterIdValue =
            chat.posterId && chat.posterId._id ?
            chat.posterId._id.toString() :
            chat.posterId.toString();

        const workerIdValue =
            chat.workerId && chat.workerId._id ?
            chat.workerId._id.toString() :
            chat.workerId.toString();

        const isParticipant =
            posterIdValue === req.user.id || workerIdValue === req.user.id;

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized to view this chat",
            });
        }

        // Mark incoming messages as read
        chat.messages.forEach((msg) => {
            if (msg.senderId.toString() !== req.user.id) {
                msg.readStatus = true;
            }
        });

        await chat.save();

        const sortedMessages = [...chat.messages].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );

        return res.json({
            chat: {
                _id: chat._id,
                jobId: chat.jobId,
                poster: chat.posterId,
                worker: chat.workerId,
                applicationId: chat.applicationId,
                isActive: chat.isActive,
                messages: sortedMessages,
            },
        });
    } catch (err) {
        console.error("GET MESSAGES ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ================= GET ALL CHATS FOR A JOB =================
// GET /api/chat/job/:jobId
// Only the poster of the job should see all chats for that job
router.get("/job/:jobId", auth, async(req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.posterId ? .toString() !== req.user.id) {
            return res.status(403).json({
                message: "Not authorized to view chats for this job",
            });
        }

        const chats = await Chat.find({ jobId, isActive: true })
            .populate("workerId", "name phone skills")
            .populate("posterId", "name phone")
            .populate("jobId", "category description address")
            .sort({ updatedAt: -1, createdAt: -1 });

        return res.json({ chats });
    } catch (err) {
        console.error("GET JOB CHATS ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
});

export default router;