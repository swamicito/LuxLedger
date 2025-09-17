/**
 * Referral Cookie Handler
 * Captures ?ref=XXXX from URL and stores it in browser cookie
 */

'use client'

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReferralTracker } from '../middleware';

export function ReferralCookieHandler() {
  const location = useLocation();

  useEffect(() => {
    // Handle referral tracking on route changes
    ReferralTracker.handleReferralFromURL();
  }, [location.search]);

  return null; // This component doesn't render anything
}

// Alternative implementation using js-cookie (if you prefer)
export function ReferralCookieHandlerWithJSCookie() {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      // Using js-cookie library (requires: npm install js-cookie @types/js-cookie)
      // Cookies.set('ref', ref, { expires: 7 }); // 7 days
      // Cookies.set('lux_referral', ref, { expires: 90 }); // 90 days
      
      // Manual cookie setting (no external dependency)
      document.cookie = `ref=${encodeURIComponent(ref)}; max-age=${7 * 24 * 60 * 60}; path=/; samesite=lax`;
      document.cookie = `lux_referral=${encodeURIComponent(ref)}; max-age=${90 * 24 * 60 * 60}; path=/; samesite=lax`;
    }
  }, [location.search]);

  return null;
}
