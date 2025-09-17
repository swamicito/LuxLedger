/**
 * Real-time Broker Notification System
 * Supports Telegram and Email notifications for commission events
 */

export interface NotificationConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  emailProvider?: 'sendgrid' | 'postmark' | 'supabase';
  emailApiKey?: string;
  fromEmail?: string;
}

export interface CommissionNotification {
  brokerId: string;
  brokerWallet: string;
  commissionAmount: number;
  saleAmount: number;
  sellerWallet: string;
  itemName?: string;
  transactionHash?: string;
  timestamp: string;
}

export interface TierUpgradeNotification {
  brokerId: string;
  brokerWallet: string;
  oldTier: string;
  newTier: string;
  newCommissionRate: number;
  timestamp: string;
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  /**
   * Send commission earned notification
   */
  async sendCommissionNotification(notification: CommissionNotification): Promise<void> {
    const message = this.formatCommissionMessage(notification);
    
    await Promise.all([
      this.sendTelegramNotification(message),
      this.sendEmailNotification(
        'Commission Earned - LuxBroker',
        message,
        notification.brokerWallet
      )
    ]);
  }

  /**
   * Send tier upgrade notification
   */
  async sendTierUpgradeNotification(notification: TierUpgradeNotification): Promise<void> {
    const message = this.formatTierUpgradeMessage(notification);
    
    await Promise.all([
      this.sendTelegramNotification(message),
      this.sendEmailNotification(
        'Tier Upgrade - LuxBroker',
        message,
        notification.brokerWallet
      )
    ]);
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(message: string): Promise<void> {
    if (!this.config.telegramBotToken || !this.config.telegramChatId) {
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.config.telegramChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    subject: string,
    message: string,
    brokerWallet: string
  ): Promise<void> {
    if (!this.config.emailProvider || !this.config.emailApiKey) {
      return;
    }

    try {
      switch (this.config.emailProvider) {
        case 'sendgrid':
          await this.sendSendGridEmail(subject, message, brokerWallet);
          break;
        case 'postmark':
          await this.sendPostmarkEmail(subject, message, brokerWallet);
          break;
        case 'supabase':
          await this.sendSupabaseEmail(subject, message, brokerWallet);
          break;
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendSendGridEmail(
    subject: string,
    message: string,
    brokerWallet: string
  ): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: `${brokerWallet}@luxledger.app` }], // Mock email
            subject: subject,
          },
        ],
        from: { email: this.config.fromEmail || 'notifications@luxledger.app' },
        content: [
          {
            type: 'text/html',
            value: this.formatEmailHTML(message),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }
  }

  /**
   * Send email via Postmark
   */
  private async sendPostmarkEmail(
    subject: string,
    message: string,
    brokerWallet: string
  ): Promise<void> {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.config.emailApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: this.config.fromEmail || 'notifications@luxledger.app',
        To: `${brokerWallet}@luxledger.app`, // Mock email
        Subject: subject,
        HtmlBody: this.formatEmailHTML(message),
        TextBody: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Postmark API error: ${response.statusText}`);
    }
  }

  /**
   * Send email via Supabase Edge Functions
   */
  private async sendSupabaseEmail(
    subject: string,
    message: string,
    brokerWallet: string
  ): Promise<void> {
    // This would call a Supabase Edge Function that handles email sending
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: `${brokerWallet}@luxledger.app`, // Mock email
        subject: subject,
        html: this.formatEmailHTML(message),
        text: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Supabase email error: ${response.statusText}`);
    }
  }

  /**
   * Format commission notification message
   */
  private formatCommissionMessage(notification: CommissionNotification): string {
    return `
🎉 *Commission Earned!*

💰 *Amount:* $${notification.commissionAmount.toLocaleString()}
📊 *Sale Value:* $${notification.saleAmount.toLocaleString()}
🏷️ *Item:* ${notification.itemName || 'Luxury Asset'}
👤 *Seller:* ${notification.sellerWallet.slice(0, 8)}...
⏰ *Time:* ${new Date(notification.timestamp).toLocaleString()}

${notification.transactionHash ? `🔗 *TX:* ${notification.transactionHash.slice(0, 16)}...` : ''}

Keep up the great work! 🚀
    `.trim();
  }

  /**
   * Format tier upgrade notification message
   */
  private formatTierUpgradeMessage(notification: TierUpgradeNotification): string {
    return `
🎊 *Tier Upgrade!*

📈 *Upgraded:* ${notification.oldTier} → ${notification.newTier}
💎 *New Commission Rate:* ${(notification.newCommissionRate * 100).toFixed(1)}%
👤 *Broker:* ${notification.brokerWallet.slice(0, 8)}...
⏰ *Time:* ${new Date(notification.timestamp).toLocaleString()}

Congratulations on reaching the next level! 🏆
    `.trim();
  }

  /**
   * Format message as HTML for email
   */
  private formatEmailHTML(message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LuxBroker Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
        .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 LuxBroker</h1>
            <p>Luxury Asset Affiliate Program</p>
        </div>
        <div class="content">
            <div class="highlight">
                ${message.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>')}
            </div>
        </div>
        <div class="footer">
            <p>© 2025 LuxLedger. All rights reserved.</p>
            <p>Visit your dashboard: <a href="https://luxledger.app/broker" style="color: #f59e0b;">luxledger.app/broker</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

/**
 * Default notification service instance
 */
export const notificationService = new NotificationService({
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  emailProvider: 'sendgrid',
  emailApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: 'notifications@luxledger.app',
});

/**
 * Webhook handler for real-time notifications
 */
export async function handleCommissionWebhook(
  brokerId: string,
  commissionData: Omit<CommissionNotification, 'brokerId'>
): Promise<void> {
  try {
    await notificationService.sendCommissionNotification({
      brokerId,
      ...commissionData,
    });
  } catch (error) {
    console.error('Failed to send commission notification:', error);
  }
}

/**
 * Webhook handler for tier upgrade notifications
 */
export async function handleTierUpgradeWebhook(
  brokerId: string,
  upgradeData: Omit<TierUpgradeNotification, 'brokerId'>
): Promise<void> {
  try {
    await notificationService.sendTierUpgradeNotification({
      brokerId,
      ...upgradeData,
    });
  } catch (error) {
    console.error('Failed to send tier upgrade notification:', error);
  }
}
