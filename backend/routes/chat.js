// routes/chat.js
// Handles: Create chat, Send message, Get messages, Close chat
// Mount in server.js as: app.use("/api/chat", chatRoutes);

import express from "express";
import auth from "../middleware/auth.js";
import Chat from "../models/Chat.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const router = express.Router();

// ================= CREATE CHAT =================
// POST /api/chat/create
// Called when employer clicks "Chat" on Worker Profile page (Figure 14)
// Body: { jobId, workerId, applicationId }
router.post("/create", auth, async(req, res) => {
    try {
        const { jobId, workerId, applicationId } = req.body;

        if (!jobId || !workerId || !applicationId) {
            return res.status(400).json({
                message: "jobId, workerId and applicationId are required",
            });
        }

        // Check job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Check application exists
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Check if chat already exists — return it instead of duplicate
        const existingChat = await Chat.findOne({
            jobId,
            workerId,
            posterId: req.user.id,
            isActive: true,
        });

        if (existingChat) {
            return res.json({ message: "Chat already exists", chat: existingChat });
        }

        // Create new chat
        const newChat = new Chat({
            jobId,
            posterId: req.user.id,
            workerId,
            applicationId,
            isActive: true,
            messages: [],
        });

        await newChat.save();

        res.status(201).json({
            message: "Chat created successfully",
            chat: newChat,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= SEND MESSAGE =================
// POST /api/chat/:chatId/send
// Body: { content }
// Called when user types and sends a message (Figure 15)
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

        // Only poster or worker can send messages
        const isParticipant =
            chat.posterId.toString() === req.user.id ||
            chat.workerId.toString() === req.user.id;

        if (!isParticipant) {
            return res.status(403).json({ message: "Not authorized to send message in this chat" });
        }

        if (!chat.isActive) {
            return res.status(400).json({ message: "This chat has been closed" });
        }

        // Add message
        chat.messages.push({
            senderId: req.user.id,
            content: content.trim(),
            readStatus: false,
        });

        await chat.save();

        res.json({
            message: "Message sent",
            messages: chat.messages,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ================= GET MY CHATS =================
// GET /api/chat/my-chats
// Gets all active chats for logged-in user
router.get("/my-chats", auth, async(req, res) => {
    try {
        const chats = await Chat.find({
                $or: [{ posterId: req.user.id }, { workerId: req.user.id }],
                isActive: true,
            })
            .populate("workerId", "name phone skills")
            .populate("posterId", "name phone")
            .populate("jobId", "category description address");

        res.json({ chats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= GET ALL MESSAGES =================
// GET /api/chat/:chatId/messages
// Called when chat page opens (Figure 15)
router.get("/:chatId/messages", auth, async(req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findById(chatId)
            .populate("posterId", "name phone")
            .populate("workerId", "name phone skills");

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Only participants can view
        const isParticipant =
            chat.posterId._id.toString() === req.user.id ||
            chat.workerId._id.toString() === req.user.id;

        if (!isParticipant) {
            return res.status(403).json({ message: "Not authorized to view this chat" });
        }

        // Mark messages as read for current user
        chat.messages.forEach((msg) => {
            if (msg.senderId.toString() !== req.user.id) {
                msg.readStatus = true;
            }
        });

        await chat.save();

        res.json({
            chat: {
                _id: chat._id,
                jobId: chat.jobId,
                poster: chat.posterId,
                worker: chat.workerId,
                isActive: chat.isActive,
                messages: chat.messages,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// ================= GET ALL CHATS FOR A JOB =================
// GET /api/chat/job/:jobId
// Employer sees all chats for a specific job
router.get("/job/:jobId", auth, async(req, res) => {
    try {
        const { jobId } = req.params;

        const chats = await Chat.find({ jobId, isActive: true })
            .populate("workerId", "name phone skills")
            .populate("posterId", "name phone");

        res.json({ chats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;