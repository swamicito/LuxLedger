/**
 * LuxBroker Referral Tracking Service
 * Client-side referral cookie management for React/Vite apps
 */

export class ReferralTracker {
  static setReferralCookie(referralCode: string) {
    const expires7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expires90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    // Set both short-term and long-term cookies
    document.cookie = `lux_ref_7=${referralCode}; expires=${expires7Days.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = `lux_ref=${referralCode}; expires=${expires90Days.toUTCString()}; path=/; SameSite=Lax`;
  }

  static getReferralCookie(): string | null {
    const cookies = document.cookie.split(';');
    
    // Try short-term cookie first, then long-term
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'lux_ref_7' || name === 'lux_ref') {
        return value;
      }
    }
    
    return null;
  }

  static trackReferralClick(referralCode: string) {
    // Track the referral click via API
    fetch('/netlify/functions/api-track-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error('Failed to track referral click:', error);
    });
  }

  static handleReferralFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      this.setReferralCookie(referralCode);
      this.trackReferralClick(referralCode);
      
      // Clean URL by removing ref parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
