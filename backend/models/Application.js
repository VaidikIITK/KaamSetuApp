// models/Application.js
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expectedPay: {
        type: Number,
        required: true,
    },
    preferredTime: {
        type: String, // e.g. "Morning", "Afternoon", "Evening", "Anytime"
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    remarks: String, // ✅ ADD THIS
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);