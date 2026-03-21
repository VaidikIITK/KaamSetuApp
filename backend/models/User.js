import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    address: String,
    skills: [String],
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
