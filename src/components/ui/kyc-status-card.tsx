import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { kycComplianceService, KYCStatus } from '@/lib/kyc-compliance';
import { Shield, CheckCircle, Clock, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface KYCStatusCardProps {
  kycStatus: KYCStatus;
  onStatusUpdate?: (status: KYCStatus) => void;
}

export const KYCStatusCard = ({ kycStatus, onStatusUpdate }: KYCStatusCardProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const getStatusIcon = () => {
    switch (kycStatus.status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (kycStatus.status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = () => {
    switch (kycStatus.status) {
      case 'verified':
        return t('dashboard.kyc.verified');
      case 'pending':
        return t('dashboard.kyc.pending');
      case 'rejected':
        return 'Rejected';
      default:
        return t('dashboard.kyc.required');
    }
  };

  const getVerificationProgress = () => {
    switch (kycStatus.status) {
      case 'verified':
        return 100;
      case 'pending':
        return 75;
      case 'rejected':
        return 25;
      default:
        return 0;
    }
  };

  const handleStartVerification = async () => {
    setLoading(true);
    try {
      await kycComplianceService.initialize();
      const requirements = kycComplianceService.getKYCRequirements();
      
      if (!requirements.required) {
        toast.info('KYC verification is not required in your jurisdiction');
        setLoading(false);
        return;
      }

      const { url } = await kycComplianceService.startKYCVerification(requirements.level);
      window.open(url, '_blank');
      
      toast.success('KYC verification process started');
    } catch (error) {
      console.error('Failed to start KYC verification:', error);
      toast.error('Failed to start verification process');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          {t('dashboard.kyc.status')}
        </CardTitle>
        <CardDescription>
          Verification status and trading limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={getStatusColor() as any}>
              {getStatusText()}
            </Badge>
            <span className="text-sm text-muted-foreground capitalize">
              {kycStatus.level} Level
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>{getVerificationProgress()}%</span>
            </div>
            <Progress value={getVerificationProgress()} className="h-2" />
          </div>
        </div>

        {/* Status-specific content */}
        {kycStatus.status === 'none' && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Complete identity verification to increase your trading limits and access premium features.
            </AlertDescription>
          </Alert>
        )}

        {kycStatus.status === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your verification is being reviewed. This typically takes 5-15 minutes during business hours.
            </AlertDescription>
          </Alert>
        )}

        {kycStatus.status === 'rejected' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Verification was rejected. Please review the requirements and submit new documents.
            </AlertDescription>
          </Alert>
        )}

        {kycStatus.status === 'verified' && kycStatus.verifiedAt && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Verified on {new Date(kycStatus.verifiedAt).toLocaleDateString()}
            </div>
            {kycStatus.expiresAt && (
              <div className="mt-1">
                Expires on {new Date(kycStatus.expiresAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Trading Limits */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Trading Limits</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Limit:</span>
              <span className="font-medium">
                {formatCurrency(kycStatus.limits.dailyTradingLimit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Limit:</span>
              <span className="font-medium">
                {formatCurrency(kycStatus.limits.monthlyTradingLimit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Asset Value:</span>
              <span className="font-medium">
                {formatCurrency(kycStatus.limits.maxAssetValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Documents */}
        {kycStatus.documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Submitted Documents</h4>
            <div className="space-y-2">
              {kycStatus.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                  </div>
                  <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {kycStatus.status === 'none' && (
          <Button
            onClick={handleStartVerification}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              'Starting Verification...'
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('dashboard.kyc.startVerification')}
              </>
            )}
          </Button>
        )}

        {kycStatus.status === 'rejected' && (
          <Button
            onClick={handleStartVerification}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              'Restarting Verification...'
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Restart Verification
              </>
            )}
          </Button>
        )}

        {/* Upgrade Option */}
        {kycStatus.status === 'verified' && kycStatus.level === 'basic' && (
          <Button
            onClick={() => handleStartVerification()}
            variant="outline"
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            Upgrade to Enhanced Verification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
