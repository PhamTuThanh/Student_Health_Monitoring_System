import express from 'express';
import { checkAndSendReminders } from '../controllers/reminderController.js';

const router = express.Router();

// Route to manually trigger reminder check
router.get('/check-reminders', async (req, res) => {
    try {
        const result = await checkAndSendReminders();
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default router; 