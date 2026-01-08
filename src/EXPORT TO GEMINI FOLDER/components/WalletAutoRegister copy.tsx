import { useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { getReferralFromCookie } from "@/lib/referral";

/**
 * Auto-register component that registers sellers when wallet connects
 * Should be placed in root layout or app component
 */
export function WalletAutoRegister() {
  const { account } = useWallet();

  useEffect(() => {
    const register = async () => {
      if (!account?.address) return;
      
      const ref = getReferralFromCookie();

      // Register the seller (non-blocking, safe if repeated)
      try {
        const response = await fetch("/api/broker/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: "seller",
            wallet: account.address,
            ref,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Seller auto-registered:", data);
        }
      } catch (error) {
        // Silent fail - registration will be attempted again on next connect
        console.debug("Auto-registration failed:", error);
      }
    };

    register();
  }, [account?.address]);

  return null;
}
