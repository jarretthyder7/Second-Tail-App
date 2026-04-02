// Email template functions for different notification types

export const emailTemplates = {
  welcomeFoster: (name: string, orgName?: string) => ({
    subject: "Welcome to Second Tail!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">Welcome, ${name}!</h1>
        <p>Thank you for joining Second Tail and becoming a foster parent.</p>
        ${orgName ? `<p>You've been connected with <strong>${orgName}</strong> and will receive updates about animals in need of temporary homes.</p>` : "<p>Complete your profile to get matched with rescue organizations near you.</p>"}
        <p style="margin-top: 30px; color: #666;">Together, we\'re saving lives. 🐾</p>
      </div>
    `,
  }),

  welcomeRescue: (orgName: string, adminName: string) => ({
    subject: `Welcome, ${orgName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #92400e;">Welcome to Second Tail, ${orgName}!</h1>
        <p>Hi ${adminName},</p>
        <p>Your rescue organization account has been created successfully. You can now:</p>
        <ul>
          <li>Manage your foster network</li>
          <li>Track animal care with daily logs</li>
          <li>Communicate with fosters in real-time</li>
          <li>View medical records and care plans</li>
        </ul>
        <p style="margin-top: 30px; color: #666;">Let's save more lives together!</p>
      </div>
    `,
  }),

  assignedToRescue: (fosterName: string, orgName: string) => ({
    subject: "You've been matched with a rescue organization!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">Great news, ${fosterName}!</h1>
        <p>You've been matched with <strong>${orgName}</strong>!</p>
        <p>You can now:</p>
        <ul>
          <li>View animals available for fostering</li>
          <li>Receive messages and updates from the rescue team</li>
          <li>Request supplies and support</li>
          <li>Submit daily care logs</li>
        </ul>
        <p>Log in to your dashboard to get started.</p>
      </div>
    `,
  }),

  assignedDog: (fosterName: string, animalName: string, animalType: string) => ({
    subject: `Meet ${animalName}! You've been matched for fostering`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">Meet ${animalName}! 🐾</h1>
        <p>Hi ${fosterName},</p>
        <p>You've been matched to foster <strong>${animalName}</strong>, a ${animalType}.</p>
        <p>Check your dashboard for:</p>
        <ul>
          <li>Care plan and medical information</li>
          <li>Feeding and exercise guidelines</li>
          <li>Emergency contact information</li>
          <li>Updates from the rescue team</li>
        </ul>
        <p>Thank you for making a difference in ${animalName}'s life!</p>
      </div>
    `,
  }),

  appointment: (fosterName: string, animalName: string, appointmentTitle: string, appointmentTime: string) => ({
    subject: `Appointment scheduled: ${appointmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">Appointment Scheduled</h1>
        <p>Hi ${fosterName},</p>
        <p>An appointment has been scheduled for ${animalName}:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${appointmentTitle}</strong></p>
          <p style="color: #666;">📅 ${appointmentTime}</p>
        </div>
        <p>View details and confirm in your dashboard.</p>
      </div>
    `,
  }),

  newMessage: (fosterName: string, senderName: string) => ({
    subject: `New message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">New Message</h1>
        <p>Hi ${fosterName},</p>
        <p><strong>${senderName}</strong> sent you a message.</p>
        <p>Log in to your dashboard to read and reply.</p>
      </div>
    `,
  }),

  medicalUpdate: (fosterName: string, animalName: string, updateType: string) => ({
    subject: `Important update for ${animalName}: ${updateType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">Important Medical Update</h1>
        <p>Hi ${fosterName},</p>
        <p>There's an important medical update for ${animalName}:</p>
        <p><strong>${updateType}</strong></p>
        <p>Check your dashboard for full details and next steps.</p>
      </div>
    `,
  }),

  supplyRequest: (rescueName: string, fosterName: string, supplies: string) => ({
    subject: `${fosterName} has requested supplies`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #92400e;">Supply Request from Foster</h1>
        <p>Hi ${rescueName},</p>
        <p><strong>${fosterName}</strong> has requested supplies:</p>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">${supplies}</p>
        <p>Visit your admin dashboard to review and respond.</p>
      </div>
    `,
  }),

  appointmentReminder: (
    fosterName: string,
    animalName: string,
    appointmentTitle: string,
    appointmentDate: string,
    appointmentTime: string,
    location: string,
    notes?: string,
  ) => ({
    subject: `Reminder: ${appointmentTitle} for ${animalName} - ${appointmentDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7; border-radius: 12px;">
        <h1 style="color: #92400e;">Appointment Reminder 📅</h1>
        <p>Hi ${fosterName},</p>
        <p>This is a reminder about the upcoming appointment for <strong>${animalName}</strong>:</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
          <p style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #92400e;">${appointmentTitle}</p>
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${appointmentDate}</p>
          <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${appointmentTime}</p>
          <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
          ${notes ? `<p style="margin-top: 15px; padding: 10px; background-color: #fef3c7; border-radius: 4px;"><strong>Notes:</strong> ${notes}</p>` : ""}
        </div>
        
        <p>Please arrive 10 minutes early and bring any necessary documents.</p>
        <p style="margin-top: 30px; color: #666;">Questions? Reply to this email or contact us through your dashboard.</p>
      </div>
    `,
  }),

  appointmentConfirmation: (
    fosterName: string,
    animalName: string,
    appointmentTitle: string,
    appointmentDate: string,
    appointmentTime: string,
    location: string,
    checkinInstructions?: string,
  ) => ({
    subject: `Appointment Confirmed: ${appointmentTitle} for ${animalName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">✓ Appointment Confirmed</h1>
        <p>Hi ${fosterName},</p>
        <p>Your appointment for <strong>${animalName}</strong> has been confirmed:</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #065f46;">${appointmentTitle}</p>
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${appointmentDate}</p>
          <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${appointmentTime}</p>
          <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
        </div>
        
        ${
          checkinInstructions
            ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin: 0 0 10px 0;">Check-in Instructions:</p>
          <p style="margin: 0;">${checkinInstructions}</p>
        </div>
        `
            : ""
        }
        
        <p>We'll send you a reminder 24 hours before the appointment.</p>
        <p style="margin-top: 30px; color: #666;">See you soon!</p>
      </div>
    `,
  }),

  appointmentUpdate: (
    fosterName: string,
    animalName: string,
    appointmentTitle: string,
    updateType: string,
    updateDetails?: string,
  ) => ({
    subject: `Appointment Update: ${appointmentTitle} for ${animalName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">Appointment Update</h1>
        <p>Hi ${fosterName},</p>
        <p>There's been an update to the appointment for <strong>${animalName}</strong>:</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${updateType}</strong></p>
          ${updateDetails ? `<p style="margin-top: 10px; color: #666;">${updateDetails}</p>` : ""}
        </div>
        <p>Check your dashboard for full details.</p>
      </div>
    `,
  }),

  fosterInvitation: (orgName: string, inviteCode: string, signUpUrl: string) => ({
    subject: `You've been invited to foster with ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">You're Invited to Foster!</h1>
        <p><strong>${orgName}</strong> has invited you to join their foster network on Second Tail.</p>
        <p>Use the button below or enter your invitation code when signing up:</p>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="font-size: 13px; color: #92400e; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your Invitation Code</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #92400e; margin: 0;">${inviteCode}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${signUpUrl}" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none;">Create Your Foster Account</a>
        </div>
        <p style="color: #666; font-size: 13px;">Or copy this link into your browser:<br/><a href="${signUpUrl}" style="color: #d97706;">${signUpUrl}</a></p>
        <p style="margin-top: 30px; color: #999; font-size: 12px;">This invitation was sent by ${orgName}. If you did not expect this email, you can safely ignore it.</p>
      </div>
    `,
  }),

  orgPaused: (orgName: string, pausedBy: string, pausedUntil: string, months: number) => ({
    subject: `${orgName} has been paused for ${months} month${months > 1 ? "s" : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b;">Organization Paused</h1>
        <p>Your rescue organization <strong>${orgName}</strong> has been temporarily paused.</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Paused by:</strong> ${pausedBy}</p>
          <p><strong>Duration:</strong> ${months} month${months > 1 ? "s" : ""}</p>
          <p><strong>Pause until:</strong> ${pausedUntil}</p>
        </div>
        <p>During this time, foster activities will be limited. You can resume operations at any time by contacting support or reopening your organization.</p>
        <p style="margin-top: 30px; color: #666;">If you have questions, please reach out to the Second Tail support team.</p>
      </div>
    `,
  }),

  orgClosed: (orgName: string, closedBy: string) => ({
    subject: `${orgName} organization has been closed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Organization Closed</h1>
        <p>Your rescue organization <strong>${orgName}</strong> has been permanently closed.</p>
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Closed by:</strong> ${closedBy}</p>
          <p><strong>Closure date:</strong> ${new Date().toDateString()}</p>
        </div>
        <p>All foster assignments have been ended and fosters have been notified. Your organization data has been archived for records.</p>
        <p>If you wish to reopen your organization in the future, please contact the Second Tail support team.</p>
        <p style="margin-top: 30px; color: #666;">Thank you for your service to animal rescue.</p>
      </div>
    `,
  }),
}
