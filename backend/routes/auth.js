import bcrypt from "bcrypt";
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import User from "../models/User.js";

// ─── Disk Storage Setup ──────────────────────────────────────────────────────

const uploadDir = "uploads/profile_images";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

// ─────────────────────────────────────────────────────────────────────────────

const router = express.Router();

let otpStore = {};

// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[email] = otp;

  console.log("OTP:", otp);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}`,
  });

  res.json({ message: "OTP sent" });
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, address, skills, role, otp } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (otpStore[email] !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Normalize skills
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills;
    } else if (typeof skills === "string") {
      parsedSkills = skills.split(",").map(s => s.trim()).filter(Boolean);
    }

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address,
      role: role === "worker" ? "worker" : "user",
      skills: role === "worker" ? parsedSkills : [],
      profileImage: `${process.env.BASE_URL}/uploads/profile_images/default.png`,
    });

    await newUser.save();

    delete otpStore[email];

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password: _, ...userData } = user._doc;

    res.json({
      message: "Login success",
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (otpStore[email] !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    delete otpStore[email];

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= UPDATE PROFILE =================
router.put(
  "/update-profile",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      console.log("ROUTE HIT");
      console.log("BODY:", req.body || "No body");
      console.log("FILE:", req.file || "No file");
 
      const { id, name, address, skills } = req.body || {};
 
      if (!id) {
        return res.status(400).json({ message: "Missing user ID" });
      }
 
      const user = await User.findById(id);
 
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
 
      if (name) user.name = name;
      if (address) user.address = address;
 
      // FIX: FormData sends skills as a comma string — convert to array
      if (skills) {
        user.skills = skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
 
      if (req.file) {
        if (user.profileImage) {
          const oldFilename = user.profileImage.split(
            "/uploads/profile_images/",
          )[1];
          if (oldFilename && oldFilename !== "default.png") {
            const oldPath = path.join(uploadDir, oldFilename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        }
 
        user.profileImage = `/uploads/profile_images/${req.file.filename}`;
      }
 
      await user.save();
 
      return res.json({
        message: "Profile updated",
        user,
      });
    } catch (err) {
      console.log("FULL ERROR:", err);
      return res.status(500).json({
        message: "Server error",
        error: err.message,
      });
    }
  },
);
// export default router;
export default router;
