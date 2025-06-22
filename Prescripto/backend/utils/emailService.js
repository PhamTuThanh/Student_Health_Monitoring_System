import nodemailer from 'nodemailer';
import doctorModel from '../models/doctorModel.js';

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    }
});

export const sendAppointmentNotification = async (appointment) => {
    try {
        const { docId, docData, userData, slotDate, slotTime, amount } = appointment;

        // Get doctor's email from database
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            throw new Error('Doctor not found');
        }

        // Email to admin
        await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: process.env.SMTP_HOST,
            subject: "New Appointment Booking",
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
  <div style="text-align: center; margin-bottom: 25px;">
    <h2 style="color: #0070d1; margin: 0; font-size: 24px; font-weight: 600;">✓ Appointment Confirmed</h2>
    <p style="color: #666; margin-top: 8px; font-size: 14px;">Your appointment has been successfully booked</p>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
    <thead>
      <tr style="background-color: #f2f6fc;">
        <th colspan="2" style="padding: 12px 15px; text-align: left; font-size: 16px; color: #0070d1; border-bottom: 1px solid #e0e0e0;">Appointment Details</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Patient</td>
        <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${userData.name}</td>
      </tr>
      
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Doctor</td>
        <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${docData.name}</td>
      </tr>
      
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Date</td>
        <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotDate}</td>
      </tr>
      
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Time</td>
        <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotTime}</td>
      </tr>
      
      <tr>
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Amount</td>
        <td style="padding: 12px 15px; color: #0070d1; font-weight: 600; font-size: 15px;">$${amount}</td>
      </tr>
    </tbody>
  </table>
  
  <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
    <thead>
      <tr style="background-color: #f2f6fc;">
        <th colspan="2" style="padding: 12px 15px; text-align: left; font-size: 16px; color: #0070d1; border-bottom: 1px solid #e0e0e0;">Contact Information</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Email</td>
        <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${userData.email}</td>
      </tr>
      
      <tr>
        <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Phone</td>
        <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${userData.phone || 'Not provided'}</td>
      </tr>
    </tbody>
  </table>
  
  <div style="margin-top: 25px; text-align: center; font-size: 14px; color: #666666;">
    <p style="margin: 0;">If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
  </div>
</div>
`
        });

        // Email to doctor using email from doctorSchema
        await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: doctor.email, // Using email from doctorSchema
            subject: "New Appointment Request",
            html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h2 style="color: #0070d1; margin: 0; font-size: 24px; font-weight: 600;">New Appointment Request</h2>
                  <p style="color: #666; margin-top: 8px; font-size: 14px;">A new appointment has been requested</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                  <thead>
                    <tr style="background-color: #f2f6fc;">
                      <th colspan="2" style="padding: 12px 15px; text-align: left; font-size: 16px; color: #0070d1; border-bottom: 1px solid #e0e0e0;">Appointment Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Patient</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${userData.name}</td>
                    </tr>
                    
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Date</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotDate}</td>
                    </tr>
                    
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Time</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotTime}</td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Amount</td>
                      <td style="padding: 12px 15px; color: #0070d1; font-weight: 600; font-size: 15px;">$${amount}</td>
                    </tr>
                  </tbody>
                </table>
                
                <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                  <thead>
                    <tr style="background-color: #f2f6fc;">
                      <th colspan="2" style="padding: 12px 15px; text-align: left; font-size: 16px; color: #0070d1; border-bottom: 1px solid #e0e0e0;">Contact Information</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Email</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${userData.email}</td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Phone</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${userData.phone || 'Not provided'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `
        });

        // Email to user
        await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: userData.email,
            subject: "Appointment Confirmation",
            html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h2 style="color: #0070d1; margin: 0; font-size: 24px; font-weight: 600;">Appointment Confirmation</h2>
                  <p style="color: #666; margin-top: 8px; font-size: 14px;">Your appointment has been successfully booked</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                  <thead>
                    <tr style="background-color: #f2f6fc;">
                      <th colspan="2" style="padding: 12px 15px; text-align: left; font-size: 16px; color: #0070d1; border-bottom: 1px solid #e0e0e0;">Appointment Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Doctor</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${docData.name}</td>
                    </tr>
                    
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Date</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotDate}</td>
                    </tr>
                    
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Time</td>
                      <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotTime}</td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Amount</td>
                      <td style="padding: 12px 15px; color: #0070d1; font-weight: 600; font-size: 15px;">$${amount}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div style="margin-top: 25px; text-align: center; font-size: 14px; color: #666666;">
                  <p style="margin: 0;">If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
                </div>
              </div>
            `
        });
        return { success: true };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

export const sendAppointmentReminder = async (appointment) => {
    try {
        const { docData, userData, slotDate, slotTime } = appointment;

        await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: userData.email,
            subject: "Appointment Reminder",
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h2 style="color: #0070d1; margin: 0; font-size: 24px; font-weight: 600;">⏰ Appointment Reminder</h2>
                        <p style="color: #666; margin-top: 8px; font-size: 14px;">Your appointment is scheduled in 1 hour</p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                        <thead>
                            <tr style="background-color: #f2f6fc;">
                                <th colspan="2" style="padding: 12px 15px; text-align: left; font-size: 16px; color: #0070d1; border-bottom: 1px solid #e0e0e0;">Appointment Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e0e0e0;">
                                <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Doctor</td>
                                <td style="padding: 12px 15px; color: #333333; font-size: 15px;">Dr. ${docData.name}</td>
                            </tr>
                            
                            <tr style="border-bottom: 1px solid #e0e0e0;">
                                <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Date</td>
                                <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotDate}</td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 12px 15px; font-weight: 600; width: 140px; color: #555555; font-size: 15px; border-right: 1px solid #e0e0e0;">Time</td>
                                <td style="padding: 12px 15px; color: #333333; font-size: 15px;">${slotTime}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 25px; text-align: center; font-size: 14px; color: #666666;">
                        <p style="margin: 0;">Please arrive 15 minutes before your scheduled appointment time.</p>
                        <p style="margin: 10px 0;">If you need to reschedule or cancel, please contact us immediately.</p>
                    </div>
                </div>
            `
        });

        return { success: true };
    } catch (error) {
        console.error('Reminder email sending failed:', error);
        return { success: false, error: error.message };
    }
};

export const sendForgotPasswordEmail = async (email, newPassword) => {
    try {
        console.log('📧 Sending new password email to:', email);
        
        await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: email,
            subject: "Mật khẩu mới - Prescripto",
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h2 style="color: #2196F3; margin: 0; font-size: 24px; font-weight: 600;">🔐 Mật khẩu mới</h2>
                        <p style="color: #666; margin-top: 8px; font-size: 14px;">Mật khẩu mới cho tài khoản Prescripto của bạn</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
                        <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">
                            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
                            Dưới đây là mật khẩu mới để đăng nhập.
                        </p>
                    </div>
                    
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #2196F3;">
                        <p style="margin: 0; text-align: center; font-size: 18px; font-weight: 600; color: #1976d2;">
                            Mật khẩu mới của bạn:
                        </p>
                        <p style="margin: 10px 0; text-align: center; font-size: 24px; font-weight: bold; color: #2196F3; letter-spacing: 2px; background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #2196F3;">
                            ${newPassword}
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin-bottom: 20px;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>Lưu ý quan trọng:</strong>
                        </p>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #856404; font-size: 14px;">
                            <li>Vui lòng đăng nhập ngay với mật khẩu mới này</li>
                            <li>Sau khi đăng nhập, bạn nên thay đổi mật khẩu trong phần cài đặt tài khoản</li>
                            <li>Không chia sẻ mật khẩu này với người khác</li>
                            <li>Mật khẩu này chỉ có hiệu lực một lần</li>
                        </ul>
                    </div>
                    
                    <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; font-size: 14px; color: #666666;">
                        <p style="margin: 0;">Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ hỗ trợ ngay lập tức.</p>
                        <p style="margin: 10px 0;">Cảm ơn bạn đã sử dụng Prescripto!</p>
                    </div>
                </div>
            `
        });

        console.log('✅ New password email sent successfully to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ New password email sending failed:', error);
        return { success: false, error: error.message };
    }
};