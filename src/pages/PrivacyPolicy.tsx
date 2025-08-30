import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            {t('legal.privacy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p>
                We collect information you provide directly, such as account details, 
                KYC documentation, and transaction history on the XRP Ledger.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Wallet Integration</h2>
              <p>
                When you connect your XUMM wallet, we access your public wallet address 
                and transaction history for portfolio management and compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Geographic Data</h2>
              <p>
                We use GeoIP services to determine your location for regulatory compliance 
                and to provide region-specific features and legal disclosures.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p>
                Your data is encrypted and stored securely. We never store private keys 
                or sensitive wallet information on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
              <p>
                We integrate with Supabase for data storage, Resend for emails, and 
                various fiat onramp providers for payment processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. 
                Contact us to exercise these rights.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
