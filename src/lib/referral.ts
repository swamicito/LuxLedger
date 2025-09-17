/**
 * Referral cookie helper utilities
 * Provides simple functions to get referral codes from cookies
 */

export function getReferralFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)lux_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getShortReferralFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)lux_ref_7=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearReferralCookies(): void {
  if (typeof document === "undefined") return;
  
  // Clear both referral cookies
  document.cookie = "lux_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "lux_ref_7=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

export function setReferralCookie(referralCode: string): void {
  if (typeof document === "undefined") return;
  
  const now = new Date();
  
  // Set 7-day cookie
  const expires7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  document.cookie = `lux_ref_7=${encodeURIComponent(referralCode)}; expires=${expires7.toUTCString()}; path=/; SameSite=Lax`;
  
  // Set 90-day cookie
  const expires90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  document.cookie = `lux_ref=${encodeURIComponent(referralCode)}; expires=${expires90.toUTCString()}; path=/; SameSite=Lax`;
}
