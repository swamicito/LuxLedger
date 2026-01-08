# LuxLedger Incident Playbook

> **One-page guide for handling critical incidents during launch**

---

## 🚨 Incident Response Principles

1. **Communicate early** - Silence kills trust faster than bugs
2. **Acknowledge first** - Users need to know you're aware
3. **Update regularly** - Even "still investigating" is better than nothing
4. **Document everything** - For post-mortem and legal protection

---

## Scenario 1: Escrow Transaction Fails

### Symptoms
- User reports funds sent but escrow not created
- Transaction shows on XRPL but not in dashboard
- Error during escrow creation/release

### Immediate Actions
1. **Verify on XRPL Explorer** - Check if transaction actually occurred
   - Testnet: https://testnet.xrpl.org
   - Mainnet: https://livenet.xrpl.org
2. **Check Supabase logs** - Look for failed database writes
3. **Preserve all transaction hashes** - Screenshot and save

### User Communication
> "We've identified an issue with your escrow transaction. Your funds are safe on the XRPL blockchain. Our team is investigating and will update you within 2 hours. Reference: [TX_HASH]"

### Resolution Path
- If funds on-chain but not in DB: Manual database reconciliation
- If escrow created but UI not showing: Clear cache, force refresh
- If true failure: Initiate manual refund via XRPL

### Escalation
- If unresolved in 4 hours → Contact XRPL developer support
- If funds at risk → Pause all escrow operations

---

## Scenario 2: XUMM Wallet Service Down

### Symptoms
- Users cannot connect wallets
- "XUMM unavailable" errors
- QR codes not generating

### Immediate Actions
1. **Check XUMM Status** - https://status.xumm.app
2. **Check our integration** - Test with team wallet
3. **Enable fallback messaging**

### User Communication
> "Wallet connection is temporarily unavailable due to a third-party service issue. We're monitoring the situation. You can still browse the marketplace. We'll notify you when service is restored."

### Workarounds
- Display read-only mode for marketplace
- Queue transactions for later processing
- Offer email notification when service returns

### Escalation
- If down > 1 hour → Post status on social media
- If down > 4 hours → Email all active users

---

## Scenario 3: Supabase Database Outage

### Symptoms
- App loads but shows empty data
- "Failed to load" errors throughout
- Authentication not working

### Immediate Actions
1. **Check Supabase Status** - https://status.supabase.com
2. **Check our project dashboard** - https://app.supabase.com
3. **Verify API keys still valid**

### User Communication
> "We're experiencing temporary database issues. Your data is safe and will be restored shortly. Please try again in 30 minutes."

### Workarounds
- Enable static fallback pages
- Show cached data where possible
- Disable write operations temporarily

### Escalation
- If down > 30 min → Contact Supabase support
- If down > 2 hours → Consider backup restore

---

## Scenario 4: Seller Scam / Fraud Detected

### Symptoms
- Buyer reports item not as described
- Multiple disputes against same seller
- Suspected counterfeit goods

### Immediate Actions
1. **Freeze seller's active escrows** - Do NOT release funds
2. **Document all evidence** - Screenshots, messages, photos
3. **Contact affected buyers** - Acknowledge the issue

### User Communication (to Buyer)
> "We've received your report and are taking it seriously. Your funds remain protected in escrow. Our fraud team is investigating. You'll receive an update within 24 hours."

### User Communication (to Seller)
> "Your account has been flagged for review due to buyer reports. All pending transactions are paused. Please respond to this email with documentation within 48 hours."

### Resolution Path
1. Review all evidence from both parties
2. Check seller verification documents
3. Make determination within 72 hours
4. Release funds to appropriate party
5. If fraud confirmed: Ban seller, report to authorities if applicable

### Escalation
- If high-value (>$10,000) → Senior review required
- If legal threat → Consult legal counsel
- If pattern detected → Audit all seller's transactions

---

## Scenario 5: Security Breach Suspected

### Symptoms
- Unusual login patterns
- Unauthorized transactions
- User reports account compromise

### Immediate Actions
1. **DO NOT PANIC** - Follow the checklist
2. **Rotate all API keys** - Supabase, XUMM, Resend
3. **Enable maintenance mode**
4. **Preserve logs** - Do not delete anything

### User Communication
> "We're investigating a potential security issue. As a precaution, we've temporarily paused all transactions. Your funds in escrow remain secure on the blockchain. We'll provide an update within 1 hour."

### Escalation
- Immediately notify all team members
- If data breach confirmed → Legal notification requirements apply
- Document timeline for potential regulatory inquiry

---

## 📞 Emergency Contacts

| Service | Contact | Response Time |
|---------|---------|---------------|
| XUMM Support | developers@xumm.app | 24-48 hours |
| Supabase Support | support@supabase.com | 24 hours |
| XRPL Foundation | Via Discord | Community-based |
| Domain/Hosting | Netlify Support | 24 hours |

---

## 📋 Incident Log Template

```
Date/Time: 
Reported By: 
Severity: [Low/Medium/High/Critical]
Summary: 

Timeline:
- HH:MM - Issue first reported
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Confirmed resolved

Root Cause: 
Resolution: 
Prevention: 
```

---

## ✅ Post-Incident Checklist

- [ ] All affected users notified of resolution
- [ ] Incident logged with full timeline
- [ ] Root cause documented
- [ ] Prevention measures identified
- [ ] Team debrief completed
- [ ] Status page updated (if applicable)
- [ ] Social media updated (if public incident)

---

*Last updated: January 2026*
*Review quarterly or after any major incident*
