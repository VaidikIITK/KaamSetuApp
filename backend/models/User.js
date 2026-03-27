import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    address: String,
    skills: [String],
    profileImage: { type: String, default: "profile.jpg" },

    role: {
        type: String,
        enum: ["user", "worker"],
        default: "user",
    },
    ratings: [
      {
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String },
        givenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
 

    // ================= REFERRALS =================
    referrals: [{
        workerName: {
            type: String,
            required: true,
        },
        workerPhone: {
            type: String,
            required: true,
        },
        skills: [{
            type: String,
        }, ],
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }, ],
}, { timestamps: true });

export default mongoose.model("User", userSchema);