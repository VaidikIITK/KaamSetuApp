import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("API KEY:", process.env.CLOUDINARY_API_KEY);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_images",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });


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
    const { name, email, phone, password, address, skills, otp } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    if (otpStore[email] !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address,
      skills,
      profileImage : "https://res.cloudinary.com/djs5bhgwg/image/upload/v1774383665/fad5e79954583ad50ccb3f16ee64f66d_xapp4i.jpg",
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

router.put(
  "/update-profile",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      console.log("ROUTE HIT");

      // ✅ SAFE loggin
      console.log("BODY:", req.body || "No body");
      console.log("FILE:", req.file || "No file");

      const { id, name, email, phone, address, skills } = req.body || {};

      if (!id) {
        return res.status(400).json({ message: "Missing user ID" });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ update fields safely
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (skills) user.skills = skills;

      // ✅ SAFE image handling
      if (req.file && req.file.path) {
        user.profileImage = req.file.path;
      }

      await user.save();

      return res.json({
        message: "Profile updated",
        user,
      });
    } catch (err) {
      console.log("FULL ERROR:", err); // 🔥 THIS IS KEY
      return res.status(500).json({
        message: "Server error",
        error: err.message,
      });
    }
  }
);




export default router;
