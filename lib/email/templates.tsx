// Email template functions for different notification types

export const emailTemplates = {
  passwordReset: (resetUrl: string) => ({
    subject: "Reset your Second Tail password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://getsecondtail.com/logo-dog.png" alt="Second Tail" width="64" height="64" style="display: inline-block;" />
        </div>
        <h1 style="color: #D76B1A; font-size: 26px; margin-bottom: 8px;">Reset your password</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password.</p>
        <div style="text-align: center; margin: 36px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #D76B1A; color: #ffffff; padding: 16px 40px; border-radius: 999px; font-weight: bold; font-size: 17px; text-decoration: none; letter-spacing: 0.3px;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Or copy this link into your browser:<br/><a href="${resetUrl}" style="color: #D76B1A; word-break: break-all;">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you didn't request a password reset, you can safely ignore this email. This link will expire in 24 hours.</p>
      </div>
    `,
  }),

  welcomeFoster: (name: string, orgName?: string, confirmationUrl?: string) => ({
    subject: "Confirm your Second Tail account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://getsecondtail.com/logo-dog.png" alt="Second Tail" width="64" height="64" style="display: inline-block;" />
        </div>
        <h1 style="color: #d97706; font-size: 26px; margin-bottom: 8px;">Welcome, ${name}!</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thanks for signing up to foster with Second Tail. To get started, please confirm your email address.</p>
        ${orgName ? `<p style="color: #374151;">You'll be connected with <strong>${orgName}</strong> once your account is confirmed.</p>` : ""}
        ${confirmationUrl ? `
        <div style="text-align: center; margin: 36px 0;">
          <a href="${confirmationUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 16px 40px; border-radius: 999px; font-weight: bold; font-size: 17px; text-decoration: none; letter-spacing: 0.3px;">Confirm My Account</a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Or copy this link into your browser:<br/><a href="${confirmationUrl}" style="color: #d97706; word-break: break-all;">${confirmationUrl}</a></p>
        ` : ""}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you didn't create a Second Tail account, you can safely ignore this email.</p>
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

  // Notification to foster when rescue org sends them a message
  messageNotificationToFoster: (fosterName: string, orgName: string) => ({
    subject: `New message from ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">New Message</h1>
        <p>Hi ${fosterName},</p>
        <p><strong>${orgName}</strong> sent you a message.</p>
        <p>Log in to your dashboard to read and reply.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://getsecondtail.com/login" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none;">View Message</a>
        </div>
      </div>
    `,
  }),

  // Notification to rescue org when foster sends them a message
  newMessageToOrg: (orgName: string, fosterName: string, dogName: string) => ({
    subject: `New message from ${fosterName} re: ${dogName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #92400e;">New Message from Foster</h1>
        <p>Hi ${orgName},</p>
        <p><strong>${fosterName}</strong> sent you a new message about <strong>${dogName}</strong>.</p>
        <p>Log in to Second Tail to reply.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://getsecondtail.com/login" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none;">View Message</a>
        </div>
      </div>
    `,
  }),

  // Notification to rescue org when foster requests an appointment
  appointmentRequest: (orgName: string, fosterName: string, dogName: string, appointmentType: string, preferredDate: string) => ({
    subject: `${fosterName} requested a ${appointmentType} appointment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #92400e;">Appointment Request</h1>
        <p>Hi ${orgName},</p>
        <p><strong>${fosterName}</strong> has requested a <strong>${appointmentType}</strong> for <strong>${dogName}</strong> on <strong>${preferredDate}</strong>.</p>
        <p>Log in to review and schedule it.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://getsecondtail.com/login" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none;">View Request</a>
        </div>
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

  supplyRequest: (rescueName: string, fosterName: string, supplies: string, animalName?: string, orgId?: string) => ({
    subject: `${fosterName} has requested supplies${animalName ? ` for ${animalName}` : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #92400e;">Supply Request from Foster</h1>
        <p>Hi ${rescueName},</p>
        <p><strong>${fosterName}</strong> has requested supplies${animalName ? ` for <strong>${animalName}</strong>` : ""}:</p>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">${supplies}</p>
        <p>Visit your admin dashboard to review and respond.</p>
        ${orgId ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://getsecondtail.com/org/${orgId}/admin/supply-requests" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none;">Review Request</a>
        </div>
        ` : ""}
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

  appointmentCancelled: (fosterName: string, animalName: string, appointmentTitle: string) => ({
    subject: `Appointment Cancelled: ${appointmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Appointment Cancelled</h1>
        <p>Hi ${fosterName},</p>
        <p>Unfortunately, the appointment <strong>${appointmentTitle}</strong> for <strong>${animalName}</strong> has been cancelled.</p>
        <p>Please contact your rescue organization for more information.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://getsecondtail.com/login" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none;">View Dashboard</a>
        </div>
      </div>
    `,
  }),

  appointmentDeclined: (
    fosterName: string,
    appointmentType: string,
    requestedDate: string,
    orgName: string,
  ) => ({
    subject: "Update on your appointment request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #5A4A42;">Update on your appointment request</h1>
        <p>Hi ${fosterName.split(" ")[0]},</p>
        <p>Your recent appointment request wasn't able to be scheduled at this time.</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9ca3af;">
          <p style="margin: 6px 0;"><strong>Type:</strong> ${appointmentType}</p>
          <p style="margin: 6px 0;"><strong>Requested date:</strong> ${requestedDate}</p>
        </div>

        <p>Please reach out to your rescue directly if you'd like to find another time, or submit a new request through the app.</p>
        <p style="margin-top: 30px; color: #666;">— ${orgName}</p>
      </div>
    `,
  }),

  appointmentConfirmed: (
    fosterName: string,
    appointmentType: string,
    confirmedDate: string,
    confirmedTime: string,
    notes: string,
    orgName: string,
  ) => ({
    subject: "Your appointment has been confirmed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Your appointment has been confirmed ✓</h1>
        <p>Hi ${fosterName.split(" ")[0]},</p>
        <p>Good news — your appointment has been confirmed.</p>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 6px 0;"><strong>Type:</strong> ${appointmentType}</p>
          <p style="margin: 6px 0;"><strong>Date:</strong> ${confirmedDate}</p>
          <p style="margin: 6px 0;"><strong>Time:</strong> ${confirmedTime}</p>
          ${notes ? `<p style="margin: 6px 0;"><strong>Notes from your rescue:</strong> ${notes}</p>` : ""}
        </div>

        <p>See you then!</p>
        <p style="margin-top: 30px; color: #666;">— ${orgName}</p>
      </div>
    `,
  }),

  appointmentRequestConfirmation: (
    fosterName: string,
    appointmentType: string,
    preferredDate: string,
    preferredTime: string,
    reason: string,
  ) => ({
    subject: "We got your appointment request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">We got your appointment request</h1>
        <p>Hi ${fosterName},</p>
        <p>Your appointment request has been received. Here's what you submitted:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
          <p style="margin: 5px 0;"><strong>📋 Type:</strong> ${appointmentType}</p>
          <p style="margin: 5px 0;"><strong>📅 Preferred date:</strong> ${preferredDate}</p>
          <p style="margin: 5px 0;"><strong>🕐 Preferred time:</strong> ${preferredTime}</p>
          <p style="margin: 5px 0;"><strong>📝 Reason:</strong> ${reason}</p>
        </div>
        
        <p>Your rescue will review this and confirm a time with you — usually within 24 hours.</p>
        <p style="margin-top: 30px; color: #666;">— Second Tail</p>
      </div>
    `,
  }),

  fosterInvitation: (orgName: string, signUpUrl: string, hasAccount: boolean) => ({
    subject: `You've been invited to foster with ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706;">You're Invited to Foster!</h1>
        <p><strong>${orgName}</strong> has invited you to join their foster network on Second Tail.</p>
        <p>${hasAccount ? "You already have a Second Tail account. Click below to log in and connect your account with this rescue." : "Click below to create your foster account and join their network."}</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${signUpUrl}" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 32px; border-radius: 999px; font-weight: bold; font-size: 16px; text-decoration: none;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 13px;">Or copy this link into your browser:<br/><a href="${signUpUrl}" style="color: #d97706;">${signUpUrl}</a></p>
        <p style="margin-top: 30px; color: #999; font-size: 12px;">This invitation was sent by ${orgName}. If you did not expect this email, you can safely ignore it.</p>
      </div>
    `,
  }),

  rescueInviteFromFoster: (fosterName: string, fosterCity: string, fosterState: string, customMessage?: string) => ({
    subject: `${fosterName} thinks your rescue should try Second Tail`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fdf6ec;">
        <h1 style="color: #d97706; margin-top: 0;">You're invited to join Second Tail</h1>
        <p style="color: #5a4a42; font-size: 16px;">
          <strong>${fosterName}</strong> from <strong>${fosterCity}, ${fosterState}</strong> is a foster parent on Second Tail and wants to connect with your rescue.
        </p>
        ${customMessage ? `
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
          <p style="margin: 0; color: #666; font-size: 14px; font-style: italic;">"${customMessage}"</p>
        </div>
        ` : ''}
        <p style="color: #5a4a42; margin-top: 24px;">
          Second Tail makes it easy to manage your foster network, coordinate care, and keep everyone connected — all in one place.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://getsecondtail.com/sign-up/rescue" style="display: inline-block; background-color: #d97706; color: white; padding: 16px 40px; border-radius: 24px; font-weight: bold; font-size: 16px; text-decoration: none;">Register Your Rescue Free</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">Second Tail helps rescue organizations coordinate fosters, track animal care, and focus on what matters — saving lives.</p>
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

  fosterWaitlist: (name: string) => ({
    subject: "You're on the Second Tail waitlist 🐾",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDF6EC; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #D76B1A; padding: 32px 40px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Second Tail</h1>
          <p style="margin: 8px 0 0; color: #fde8d0; font-size: 14px;">Foster smarter. Save more lives.</p>
        </div>
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #3d2c1e; margin: 0 0 16px;">Hi ${name},</p>
          <p style="font-size: 16px; color: #3d2c1e; margin: 0 0 24px; line-height: 1.6;">
            You're officially on the <strong>Second Tail waitlist</strong>. We'll reach out as soon as a rescue organization near you joins the platform.
          </p>
          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 24px; margin: 0 0 32px;">
            <p style="font-size: 15px; color: #7c3d12; font-weight: 600; margin: 0 0 8px;">Know someone who fosters or runs a rescue?</p>
            <p style="font-size: 14px; color: #9a3412; margin: 0 0 20px; line-height: 1.5;">Help us grow — share Second Tail with someone who would love it.</p>
            <a href="https://getsecondtail.com/#foster-waitlist"
               style="display: block; background-color: #D76B1A; color: #ffffff; text-align: center; padding: 13px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 12px;">
              Refer a Friend to Foster
            </a>
            <a href="https://getsecondtail.com/sign-up/rescue"
               style="display: block; background-color: #ffffff; color: #D76B1A; text-align: center; padding: 13px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; border: 2px solid #D76B1A;">
              Refer a Rescue Org
            </a>
          </div>
          <p style="font-size: 15px; color: #5a3e2b; margin: 0; line-height: 1.6;">
            Thanks for being part of this,<br/>
            <strong>The Second Tail Team</strong>
          </p>
        </div>
        <div style="background-color: #f5e6d3; padding: 20px 40px; text-align: center; border-top: 1px solid #e8d5bc;">
          <p style="font-size: 12px; color: #9a7b62; margin: 0;">
            &copy; ${new Date().getFullYear()} Second Tail &mdash; <a href="https://getsecondtail.com" style="color: #D76B1A; text-decoration: none;">getsecondtail.com</a>
          </p>
        </div>
      </div>
    `,
  }),

  // ── Reimbursement notifications ───────────────────────────────────────────

  reimbursementSubmitted: (orgName: string, fosterName: string, amount: string, category: string, description: string) => ({
    subject: `New reimbursement request from ${fosterName} — $${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDF6EC; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #D76B1A; padding: 32px 40px;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">New Reimbursement Request</h1>
          <p style="margin: 8px 0 0; color: #fde8d0; font-size: 14px;">${orgName}</p>
        </div>
        <div style="padding: 32px 40px;">
          <p style="font-size: 16px; color: #3d2c1e; margin: 0 0 24px;">
            <strong>${fosterName}</strong> has submitted a new expense reimbursement request that needs your review.
          </p>
          <div style="background-color: #ffffff; border: 1px solid #e8d5bc; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px; width: 40%;">Amount</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 18px; font-weight: bold;">$${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px;">Category</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px; vertical-align: top;">Description</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${description}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 13px; color: #9a7b62; margin: 0;">Log in to your Second Tail dashboard to approve or reject this request.</p>
        </div>
        <div style="background-color: #f5e6d3; padding: 16px 40px; text-align: center; border-top: 1px solid #e8d5bc;">
          <p style="font-size: 12px; color: #9a7b62; margin: 0;">&copy; ${new Date().getFullYear()} Second Tail &mdash; <a href="https://getsecondtail.com" style="color: #D76B1A; text-decoration: none;">getsecondtail.com</a></p>
        </div>
      </div>
    `,
  }),

  reimbursementApproved: (fosterName: string, amount: string, category: string, notes?: string) => ({
    subject: `Your $${amount} reimbursement request has been approved ✓`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDF6EC; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #16a34a; padding: 32px 40px;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Reimbursement Approved ✓</h1>
          <p style="margin: 8px 0 0; color: #bbf7d0; font-size: 14px;">Great news — your request has been approved</p>
        </div>
        <div style="padding: 32px 40px;">
          <p style="font-size: 16px; color: #3d2c1e; margin: 0 0 16px;">Hi ${fosterName},</p>
          <p style="font-size: 15px; color: #3d2c1e; margin: 0 0 24px; line-height: 1.6;">Your rescue team has approved your reimbursement request. Payment will be sent to you soon.</p>
          <div style="background-color: #ffffff; border: 1px solid #e8d5bc; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px; width: 40%;">Amount Approved</td>
                <td style="padding: 8px 0; color: #16a34a; font-size: 18px; font-weight: bold;">$${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px;">Category</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${category}</td>
              </tr>
              ${notes ? `<tr><td style="padding: 8px 0; color: #9a7b62; font-size: 13px; vertical-align: top;">Note from rescue</td><td style="padding: 8px 0; color: #3d2c1e; font-size: 14px; font-style: italic;">${notes}</td></tr>` : ""}
            </table>
          </div>
          <p style="font-size: 15px; color: #5a3e2b; margin: 0; line-height: 1.6;">Thank you for all you do,<br/><strong>Your Rescue Team via Second Tail</strong></p>
        </div>
        <div style="background-color: #f5e6d3; padding: 16px 40px; text-align: center; border-top: 1px solid #e8d5bc;">
          <p style="font-size: 12px; color: #9a7b62; margin: 0;">&copy; ${new Date().getFullYear()} Second Tail &mdash; <a href="https://getsecondtail.com" style="color: #D76B1A; text-decoration: none;">getsecondtail.com</a></p>
        </div>
      </div>
    `,
  }),

  reimbursementRejected: (fosterName: string, amount: string, category: string, notes?: string) => ({
    subject: `Update on your $${amount} reimbursement request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDF6EC; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 32px 40px;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Reimbursement Not Approved</h1>
          <p style="margin: 8px 0 0; color: #fecaca; font-size: 14px;">Your rescue team has reviewed your request</p>
        </div>
        <div style="padding: 32px 40px;">
          <p style="font-size: 16px; color: #3d2c1e; margin: 0 0 16px;">Hi ${fosterName},</p>
          <p style="font-size: 15px; color: #3d2c1e; margin: 0 0 24px; line-height: 1.6;">Your rescue team was unable to approve this reimbursement request. Please see any notes below and reach out if you have questions.</p>
          <div style="background-color: #ffffff; border: 1px solid #e8d5bc; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px; width: 40%;">Amount Requested</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 16px; font-weight: bold;">$${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px;">Category</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${category}</td>
              </tr>
              ${notes ? `<tr><td style="padding: 8px 0; color: #9a7b62; font-size: 13px; vertical-align: top;">Reason</td><td style="padding: 8px 0; color: #3d2c1e; font-size: 14px; font-style: italic;">${notes}</td></tr>` : ""}
            </table>
          </div>
          <p style="font-size: 15px; color: #5a3e2b; margin: 0; line-height: 1.6;">If you have questions, please reach out to your rescue team directly.<br/><br/><strong>Your Rescue Team via Second Tail</strong></p>
        </div>
        <div style="background-color: #f5e6d3; padding: 16px 40px; text-align: center; border-top: 1px solid #e8d5bc;">
          <p style="font-size: 12px; color: #9a7b62; margin: 0;">&copy; ${new Date().getFullYear()} Second Tail &mdash; <a href="https://getsecondtail.com" style="color: #D76B1A; text-decoration: none;">getsecondtail.com</a></p>
        </div>
      </div>
    `,
  }),

  reimbursementPaid: (fosterName: string, amount: string, category: string, paymentDate: string, paymentMethod?: string) => ({
    subject: `Payment sent — $${amount} reimbursement 💸`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDF6EC; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 32px 40px;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Payment Sent 💸</h1>
          <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">Your reimbursement has been paid</p>
        </div>
        <div style="padding: 32px 40px;">
          <p style="font-size: 16px; color: #3d2c1e; margin: 0 0 16px;">Hi ${fosterName},</p>
          <p style="font-size: 15px; color: #3d2c1e; margin: 0 0 24px; line-height: 1.6;">Your reimbursement payment has been sent. Please allow a few days for it to arrive depending on the payment method.</p>
          <div style="background-color: #ffffff; border: 1px solid #e8d5bc; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px; width: 40%;">Amount Paid</td>
                <td style="padding: 8px 0; color: #2563eb; font-size: 18px; font-weight: bold;">$${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px;">Category</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9a7b62; font-size: 13px;">Payment Date</td>
                <td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${paymentDate}</td>
              </tr>
              ${paymentMethod ? `<tr><td style="padding: 8px 0; color: #9a7b62; font-size: 13px;">Payment Method</td><td style="padding: 8px 0; color: #3d2c1e; font-size: 14px;">${paymentMethod}</td></tr>` : ""}
            </table>
          </div>
          <p style="font-size: 15px; color: #5a3e2b; margin: 0; line-height: 1.6;">Thank you for everything you do for these animals. 🐾<br/><br/><strong>Your Rescue Team via Second Tail</strong></p>
        </div>
        <div style="background-color: #f5e6d3; padding: 16px 40px; text-align: center; border-top: 1px solid #e8d5bc;">
          <p style="font-size: 12px; color: #9a7b62; margin: 0;">&copy; ${new Date().getFullYear()} Second Tail &mdash; <a href="https://getsecondtail.com" style="color: #D76B1A; text-decoration: none;">getsecondtail.com</a></p>
        </div>
      </div>
    `,
  }),
}
