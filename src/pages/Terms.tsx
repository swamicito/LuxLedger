import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Welcome to LuxeToken, a platform for tokenizing and trading luxury assets.
            By accessing or using our platform, you agree to be bound by these Terms of Service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Platform Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            LuxeToken provides a marketplace for tokenized luxury assets including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Real estate properties</li>
            <li>Luxury vehicles</li>
            <li>Fine jewelry and watches</li>
            <li>Art and collectibles</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. User Obligations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Users must:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Complete KYC verification</li>
            <li>Provide accurate information</li>
            <li>Comply with applicable laws</li>
            <li>Maintain account security</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Asset Tokenization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Asset tokenization is subject to verification and approval.
            All assets must meet our quality and compliance standards.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Trading and Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            All transactions are recorded on the blockchain and are final.
            Platform fees apply to all transactions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            LuxeToken is not liable for market fluctuations, asset depreciation,
            or losses incurred through trading activities.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            For questions about these terms, contact us at legal@luxetoken.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}