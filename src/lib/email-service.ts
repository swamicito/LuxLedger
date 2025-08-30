import { Resend } from 'resend';

// Email service using Resend
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || 'demo-key');
  }

  // Send transaction confirmation email
  async sendTransactionConfirmation(
    to: string,
    transactionData: {
      assetName: string;
      amount: string;
      price: string;
      transactionHash: string;
      type: 'purchase' | 'sale';
    }
  ): Promise<boolean> {
    try {
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('Demo email sent:', {
          to,
          subject: `LuxLedger: ${transactionData.type === 'purchase' ? 'Purchase' : 'Sale'} Confirmation`,
          transactionData
        });
        return true;
      }

      const subject = `LuxLedger: ${transactionData.type === 'purchase' ? 'Purchase' : 'Sale'} Confirmation`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LuxLedger</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Luxury Asset Marketplace</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">
              Transaction ${transactionData.type === 'purchase' ? 'Purchase' : 'Sale'} Confirmed
            </h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #495057;">Transaction Details</h3>
              <p><strong>Asset:</strong> ${transactionData.assetName}</p>
              <p><strong>Amount:</strong> ${transactionData.amount}</p>
              <p><strong>Price:</strong> $${parseFloat(transactionData.price).toLocaleString()}</p>
              <p><strong>Transaction Hash:</strong> <code style="background: #e9ecef; padding: 2px 4px; border-radius: 3px;">${transactionData.transactionHash}</code></p>
            </div>
            
            <p style="color: #6c757d; margin-bottom: 30px;">
              Your transaction has been successfully processed on the XRP Ledger. 
              You can view the transaction details in your LuxLedger dashboard.
            </p>
            
            <div style="text-align: center;">
              <a href="https://luxledger.com/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>This is an automated message from LuxLedger. Please do not reply to this email.</p>
            <p>© 2024 LuxLedger. All rights reserved.</p>
          </div>
        </div>
      `;

      await this.resend.emails.send({
        from: 'LuxLedger <noreply@luxledger.com>',
        to: [to],
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.error('Error sending transaction confirmation email:', error);
      return false;
    }
  }

  // Send welcome email for new users
  async sendWelcomeEmail(
    to: string,
    userData: {
      name: string;
      walletAddress?: string;
    }
  ): Promise<boolean> {
    try {
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('Demo welcome email sent:', { to, userData });
        return true;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LuxLedger</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">The Elite Luxury Asset Marketplace</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userData.name}!</h2>
            
            <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
              Welcome to LuxLedger, the world's premier marketplace for tokenized luxury assets. 
              You now have access to exclusive real estate, jewelry, exotic cars, and fine art 
              backed by blockchain technology.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #495057;">What You Can Do:</h3>
              <ul style="color: #6c757d; line-height: 1.8;">
                <li>Browse and purchase tokenized luxury assets</li>
                <li>Trade asset tokens with instant XRPL settlement</li>
                <li>View your portfolio and transaction history</li>
                <li>Access exclusive luxury asset opportunities</li>
              </ul>
            </div>
            
            ${userData.walletAddress ? `
              <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; color: #0c5460;">
                  <strong>Wallet Connected:</strong> ${userData.walletAddress.slice(0, 8)}...${userData.walletAddress.slice(-6)}
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://luxledger.com/marketplace" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                Explore Marketplace
              </a>
              <a href="https://luxledger.com/dashboard" 
                 style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>Need help? Contact our support team at support@luxledger.com</p>
            <p>© 2024 LuxLedger. All rights reserved.</p>
          </div>
        </div>
      `;

      await this.resend.emails.send({
        from: 'LuxLedger <welcome@luxledger.com>',
        to: [to],
        subject: 'Welcome to LuxLedger - Your Luxury Asset Journey Begins',
        html,
      });

      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Send asset listing notification
  async sendAssetListingNotification(
    to: string,
    assetData: {
      name: string;
      type: string;
      price: string;
      image?: string;
    }
  ): Promise<boolean> {
    try {
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('Demo asset listing email sent:', { to, assetData });
        return true;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Luxury Asset Listed</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">LuxLedger Marketplace</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Exclusive Opportunity Available</h2>
            
            ${assetData.image ? `
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${assetData.image}" alt="${assetData.name}" 
                     style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
              </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #495057;">${assetData.name}</h3>
              <p><strong>Type:</strong> ${assetData.type.replace('_', ' ')}</p>
              <p><strong>Starting Price:</strong> $${parseFloat(assetData.price).toLocaleString()}</p>
            </div>
            
            <p style="color: #6c757d; margin-bottom: 30px;">
              A new luxury asset has been listed on LuxLedger. Don't miss this exclusive 
              opportunity to invest in premium tokenized assets.
            </p>
            
            <div style="text-align: center;">
              <a href="https://luxledger.com/marketplace" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Asset
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>Unsubscribe from asset notifications in your account settings.</p>
            <p>© 2024 LuxLedger. All rights reserved.</p>
          </div>
        </div>
      `;

      await this.resend.emails.send({
        from: 'LuxLedger <notifications@luxledger.com>',
        to: [to],
        subject: `New ${assetData.type.replace('_', ' ')} Listed: ${assetData.name}`,
        html,
      });

      return true;
    } catch (error) {
      console.error('Error sending asset listing notification:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
