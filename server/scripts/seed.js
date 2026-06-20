import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Item } from "../models/Item.js";
import { Match } from "../models/Match.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { runMatchingForNewItem } from "../services/ai/matching.orchestrator.js";

async function seed() {
  await connectDB();
  await Message.deleteMany({});
  await Conversation.deleteMany({});
  await Notification.deleteMany({});
  await Match.deleteMany({});
  await Item.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("User12345", 12);
  const adminHash = await bcrypt.hash("Admin12345", 12);

  const admin = await User.create({
    email: "admin@findora.local",
    passwordHash: adminHash,
    role: "admin",
    emailVerified: true,
  });
  const alice = await User.create({
    email: "alice@findora.local",
    passwordHash,
    role: "user",
    emailVerified: true,
  });
  const bob = await User.create({
    email: "bob@findora.local",
    passwordHash,
    role: "user",
    emailVerified: true,
  });

  const lostWallet = await Item.create({
    title: "Lost brown leather wallet",
    description: "Contains ID and credit cards. Lost near central library steps.",
    category: "wallet",
    location: "University campus library",
    date: new Date(),
    imageUrl: "",
    type: "lost",
    status: "open",
    postedBy: alice._id,
  });
  await runMatchingForNewItem(lostWallet);

  const foundWallet = await Item.create({
    title: "Found wallet near library",
    description: "Brown wallet with cards found on the steps of the central library.",
    category: "wallet",
    location: "University campus library",
    date: new Date(),
    imageUrl: "",
    type: "found",
    status: "open",
    postedBy: bob._id,
  });
  await runMatchingForNewItem(foundWallet);

  await Item.create({
    title: "Lost iPhone 14 black",
    description: "Black iPhone with cracked screen protector. Last seen cafeteria.",
    category: "phone",
    location: "Student cafeteria",
    date: new Date(),
    imageUrl: "",
    type: "lost",
    status: "open",
    postedBy: alice._id,
  });

  console.log("Seed complete.");
  console.log("  Admin: admin@findora.local / Admin12345");
  console.log("  Users: alice@findora.local, bob@findora.local / User12345");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
