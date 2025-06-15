import express from "express";
import {sendMessage, getMessages} from "../controllers/messageController.js";
import { verifyToken } from "../middlewares/auth.js";
const router = express.Router();

router.get("/:id", verifyToken, getMessages);
router.post("/send/:id", verifyToken, sendMessage);
export default router;
