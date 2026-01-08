import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Personal identification information for KYC compliance</li>
            <li>Asset documentation and verification materials</li>
            <li>Transaction history and trading activities</li>
            <li>Platform usage analytics</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your information is used to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verify your identity and comply with regulations</li>
            <li>Process asset tokenization requests</li>
            <li>Facilitate secure transactions</li>
            <li>Improve our platform services</li>
            <li>Send important account notifications</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Information Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We do not sell your personal information. We may share information with:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Regulatory authorities when required by law</li>
            <li>Third-party verification services for KYC</li>
            <li>Blockchain networks for transaction recording</li>
            <li>Service providers under strict confidentiality agreements</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>End-to-end encryption for sensitive data</li>
            <li>Multi-factor authentication</li>
            <li>Regular security audits</li>
            <li>Secure blockchain infrastructure</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Request data corrections</li>
            <li>Delete your account (subject to regulatory requirements)</li>
            <li>Control marketing communications</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Cookies and Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We use cookies and analytics tools to improve user experience
            and platform performance. You can control cookie preferences
            in your browser settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            For privacy-related questions, contact our Data Protection Officer
            at privacy@luxetoken.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}