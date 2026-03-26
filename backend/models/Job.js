import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    posterId: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    minBudget: { type: Number },
    maxBudget: { type: Number },
    noBudget: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, default: "pending" },
  },
  { timestamps: true },
);

// ✅ THIS IS THE CRITICAL LINE
const Job = mongoose.model("Job", jobSchema);
export default Job;
