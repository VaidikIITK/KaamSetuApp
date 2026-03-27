import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },

    // keep nullable because referred worker may not be a registered user
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    workerName: {
        type: String,
        default: "",
    },

    workerPhone: {
        type: String,
        default: "",
    },

    skills: {
        type: [String],
        default: [],
    },

    status: {
        type: String,
        default: "pending",
    },

    source: {
        type: String,
        enum: ["direct", "referral"],
        default: "direct",
    },

    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    referralId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
}, { timestamps: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;