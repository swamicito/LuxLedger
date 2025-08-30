import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            {t('legal.terms')}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using LuxLedger, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Digital Asset Risks</h2>
              <p>
                Digital assets are volatile and speculative investments. You acknowledge that 
                you understand the risks associated with digital asset trading and tokenized 
                luxury assets.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. XRPL Integration</h2>
              <p>
                Our platform utilizes the XRP Ledger for asset tokenization and trading. 
                Transaction fees and network conditions may affect your experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. KYC and Compliance</h2>
              <p>
                Users may be required to complete Know Your Customer (KYC) verification 
                depending on their jurisdiction and transaction volume.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Asset Authenticity</h2>
              <p>
                While we strive to ensure asset authenticity, users should conduct their 
                own due diligence before purchasing tokenized luxury assets.
              </p>
            </section>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Risk Warning:</strong> {t('legal.riskWarning')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
