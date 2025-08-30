import { quoteFees, type FeeQuoteInput } from '../fees';

describe('LuxLedger Fees Engine', () => {
  
  test('default fees (3% total, 1.5% buyer/seller split)', () => {
    const input: FeeQuoteInput = {
      category: 'cars',
      priceUSD: 100000,
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.buyerFeeUSD).toBe(1500);
    expect(result.sellerFeeUSD).toBe(1500);
    expect(result.platformFeeUSD).toBe(3000);
  });

  test('jewelry minimum fee ($300 total)', () => {
    const input: FeeQuoteInput = {
      category: 'jewelry',
      priceUSD: 5000, // Would normally be $150 total (3%), but minimum is $300
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(300);
    expect(result.notes).toContain('Jewelry minimum fee applied ($300 total).');
  });

  test('cars minimum fee ($1,500 total)', () => {
    const input: FeeQuoteInput = {
      category: 'cars',
      priceUSD: 25000, // Would normally be $750 total (3%), but minimum is $1,500
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(1500);
    expect(result.notes).toContain('Vehicle minimum fee applied ($1,500 total).');
  });

  test('real estate whole property (1% total, $50k cap)', () => {
    const input: FeeQuoteInput = {
      category: 're_whole',
      priceUSD: 10000000, // $10M property, cap should apply
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(50000); // Capped at $50k
    expect(result.notes).toContain('Whole-property real estate cap applied where relevant.');
  });

  test('fractional real estate primary offering (0.5% total)', () => {
    const input: FeeQuoteInput = {
      category: 're_fractional_primary',
      priceUSD: 100000,
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(500); // 0.5% of $100k
    expect(result.notes).toContain('Fractional real estate (primary offering).');
  });

  test('fractional real estate secondary trade (0.25% total)', () => {
    const input: FeeQuoteInput = {
      category: 're_fractional_secondary',
      priceUSD: 100000,
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(250); // 0.25% of $100k
    expect(result.notes).toContain('Fractional real estate (secondary trade).');
  });

  test('crypto discount (-0.5% total)', () => {
    const input: FeeQuoteInput = {
      category: 'cars',
      priceUSD: 100000,
      payMethod: 'crypto'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(2500); // 2.5% instead of 3%
    expect(result.notes).toContain('Crypto discount applied (-0.5% total).');
  });

  test('fiat rail surcharge (+0.4% total)', () => {
    const input: FeeQuoteInput = {
      category: 'cars',
      priceUSD: 100000,
      payMethod: 'fiat'
    };
    
    const result = quoteFees(input);
    
    expect(result.platformFeeUSD).toBe(3400); // 3.4% instead of 3%
    expect(result.notes).toContain('Fiat rail surcharge applied (+0.4% total).');
  });

  test('auction premium (+1% buyer only)', () => {
    const input: FeeQuoteInput = {
      category: 'cars',
      priceUSD: 100000,
      payMethod: 'fiat',
      auction: true
    };
    
    const result = quoteFees(input);
    
    expect(result.buyerFeeUSD).toBe(2700); // 1.5% + 0.2% (fiat) + 1% (auction) = 2.7%
    expect(result.sellerFeeUSD).toBe(1700); // 1.5% + 0.2% (fiat) = 1.7%
    expect(result.platformFeeUSD).toBe(4400);
    expect(result.notes).toContain('Auction buyer premium (+1%).');
  });

  test('complex scenario: crypto jewelry auction', () => {
    const input: FeeQuoteInput = {
      category: 'jewelry',
      priceUSD: 50000,
      payMethod: 'crypto',
      auction: true
    };
    
    const result = quoteFees(input);
    
    // Base: 1.5% each
    // Crypto: -0.25% each
    // Auction: +1% buyer only
    // Expected: buyer = 2.25%, seller = 1.25%
    // Total = 3.5% = $1,750
    expect(result.platformFeeUSD).toBe(1750);
    expect(result.notes).toContain('Crypto discount applied (-0.5% total).');
    expect(result.notes).toContain('Auction buyer premium (+1%).');
  });
});

// Snapshot test for API compatibility
describe('Fees API Snapshot', () => {
  test('API response format matches expected structure', () => {
    const input: FeeQuoteInput = {
      category: 'cars',
      priceUSD: 250000,
      payMethod: 'crypto',
      auction: false
    };
    
    const result = quoteFees(input);
    
    expect(result).toMatchSnapshot({
      buyerFeeUSD: expect.any(Number),
      sellerFeeUSD: expect.any(Number),
      platformFeeUSD: expect.any(Number),
      notes: expect.any(Array)
    });
  });
});
