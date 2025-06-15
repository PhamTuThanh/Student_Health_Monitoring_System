import appoinmentModel from '../models/appoinmentModel.js';
import { sendAppointmentReminder } from '../utils/emailService.js';

export const checkAndSendReminders = async () => {
    try {
        // Get current date and time
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;

        // Find appointments for today that are 1 hour away
        const appointments = await appoinmentModel.find({
            slotDate: currentDate,
            cancelled: false,
            payment: true,
            status: 'confirmed'
        });

        for (const appointment of appointments) {
            const [appointmentHour, appointmentMinute] = appointment.slotTime.split(':');
            const appointmentTime = new Date();
            appointmentTime.setHours(parseInt(appointmentHour), parseInt(appointmentMinute), 0);

            // Calculate time difference in hours
            const timeDiff = (appointmentTime - now) / (1000 * 60 * 60);

            // If appointment is exactly 1 hour away (with 5 minutes tolerance)
            if (timeDiff >= 0.95 && timeDiff <= 1.05) {
                // Send email reminder
                const emailResult = await sendAppointmentReminder(appointment);
                if (emailResult.success) {
                    console.log(`Email reminder sent for appointment: ${appointment._id}`);
                } else {
                    console.error(`Failed to send email reminder: ${emailResult.error}`);
                }
            }
        }

        return { success: true, message: 'Email Reminder check completed' };
    } catch (error) {
        console.error('Email Reminder check failed:', error);
        return { success: false, error: error.message };
    }
}; 