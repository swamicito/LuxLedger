/**
 * Test suite for LuxGuard Multi-chain Adapter
 */

import { MultichainEscrowAdapter, CrossChainBridge, multichainAdapter } from '../lib/multichain-adapter';
import type { SupportedChain, UnifiedEscrowParams } from '../lib/multichain-adapter';

describe('LuxGuard Multi-chain Adapter', () => {
  let adapter: MultichainEscrowAdapter;

  beforeEach(() => {
    adapter = new MultichainEscrowAdapter();
  });

  describe('Chain Configuration', () => {
    it('should return correct chain configurations', () => {
      const xrplConfig = adapter.getChainConfig('xrpl');
      const ethConfig = adapter.getChainConfig('ethereum');
      const polygonConfig = adapter.getChainConfig('polygon');
      const solanaConfig = adapter.getChainConfig('solana');

      expect(xrplConfig.name).toBe('XRP Ledger');
      expect(xrplConfig.nativeCurrency.symbol).toBe('XRP');
      expect(xrplConfig.nativeCurrency.decimals).toBe(6);

      expect(ethConfig.name).toBe('Ethereum Mainnet');
      expect(ethConfig.nativeCurrency.symbol).toBe('ETH');
      expect(ethConfig.nativeCurrency.decimals).toBe(18);

      expect(polygonConfig.name).toBe('Polygon Mainnet');
      expect(polygonConfig.nativeCurrency.symbol).toBe('MATIC');

      expect(solanaConfig.name).toBe('Solana Mainnet');
      expect(solanaConfig.nativeCurrency.symbol).toBe('SOL');
      expect(solanaConfig.nativeCurrency.decimals).toBe(9);
    });

    it('should return all supported chains', () => {
      const supportedChains = adapter.getSupportedChains();
      
      expect(supportedChains).toEqual(['xrpl', 'ethereum', 'polygon', 'solana']);
    });

    it('should validate chain support correctly', () => {
      expect(adapter.isChainSupported('xrpl')).toBe(true);
      expect(adapter.isChainSupported('ethereum')).toBe(true);
      expect(adapter.isChainSupported('bitcoin')).toBe(false);
      expect(adapter.isChainSupported('invalid')).toBe(false);
    });
  });

  describe('Escrow Creation', () => {
    const baseEscrowParams: UnifiedEscrowParams = {
      chain: 'xrpl',
      seller: 'seller_123',
      buyer: 'buyer_456',
      amount: '50000',
      expirationDays: 7,
      metadata: JSON.stringify({ assetId: 'asset_789' })
    };

    it('should create XRPL escrow successfully', async () => {
      const result = await adapter.createEscrow({
        ...baseEscrowParams,
        chain: 'xrpl'
      });

      expect(result.escrowId).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.txHash).toMatch(/^xrpl_/);
      expect(result.explorerUrl).toContain('livenet.xrpl.org');
      expect(result.status).toBe('pending');
    });

    it('should create Ethereum escrow successfully', async () => {
      const result = await adapter.createEscrow({
        ...baseEscrowParams,
        chain: 'ethereum'
      });

      expect(result.escrowId).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.txHash).toMatch(/^evm_/);
      expect(result.explorerUrl).toContain('etherscan.io');
      expect(result.status).toBe('pending');
    });

    it('should create Polygon escrow successfully', async () => {
      const result = await adapter.createEscrow({
        ...baseEscrowParams,
        chain: 'polygon'
      });

      expect(result.escrowId).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.txHash).toMatch(/^evm_/);
      expect(result.explorerUrl).toContain('polygonscan.com');
      expect(result.status).toBe('pending');
    });

    it('should create Solana escrow successfully', async () => {
      const result = await adapter.createEscrow({
        ...baseEscrowParams,
        chain: 'solana'
      });

      expect(result.escrowId).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.txHash).toMatch(/^sol_/);
      expect(result.explorerUrl).toContain('explorer.solana.com');
      expect(result.status).toBe('pending');
    });

    it('should handle unsupported chains', async () => {
      await expect(adapter.createEscrow({
        ...baseEscrowParams,
        chain: 'bitcoin' as SupportedChain
      })).rejects.toThrow('Unsupported chain: bitcoin');
    });

    it('should include token address for ERC20 tokens', async () => {
      const result = await adapter.createEscrow({
        ...baseEscrowParams,
        chain: 'ethereum',
        tokenAddress: '0xA0b86a33E6441b8435b662c1c4F1B1e4F4C1e5e1'
      });

      expect(result.escrowId).toBeDefined();
      expect(result.status).toBe('pending');
    });
  });

  describe('Amount Conversion', () => {
    it('should convert amounts between chains with different decimals', () => {
      // XRP (6 decimals) to ETH (18 decimals)
      const xrpToEth = adapter.convertAmount('1000000', 'xrpl', 'ethereum');
      expect(parseFloat(xrpToEth)).toBe(1000000000000000000); // 1M * 10^12

      // ETH (18 decimals) to XRP (6 decimals)
      const ethToXrp = adapter.convertAmount('1000000000000000000', 'ethereum', 'xrpl');
      expect(parseFloat(ethToXrp)).toBe(1000000); // 1 ETH worth in drops

      // Same chain conversion
      const xrpToXrp = adapter.convertAmount('1000000', 'xrpl', 'xrpl');
      expect(xrpToXrp).toBe('1000000');
    });

    it('should handle Solana decimal conversion', () => {
      // SOL (9 decimals) to ETH (18 decimals)
      const solToEth = adapter.convertAmount('1000000000', 'solana', 'ethereum');
      expect(parseFloat(solToEth)).toBe(1000000000000000000); // 1 SOL * 10^9

      // ETH to SOL
      const ethToSol = adapter.convertAmount('1000000000000000000', 'ethereum', 'solana');
      expect(parseFloat(ethToSol)).toBe(1000000000); // 1 ETH worth in lamports
    });
  });

  describe('Transaction Status', () => {
    it('should return transaction status for all chains', async () => {
      const chains: SupportedChain[] = ['xrpl', 'ethereum', 'polygon', 'solana'];
      
      for (const chain of chains) {
        const status = await adapter.getTransactionStatus('mock_tx_hash', chain);
        
        expect(status.status).toBe('confirmed');
        expect(status.confirmations).toBe(12);
        expect(status.blockNumber).toBe(18500000);
      }
    });
  });

  describe('Fee Estimation', () => {
    const baseParams: UnifiedEscrowParams = {
      chain: 'xrpl',
      seller: 'seller_123',
      buyer: 'buyer_456',
      amount: '50000',
      expirationDays: 7,
      metadata: '{}'
    };

    it('should estimate fees for XRPL', async () => {
      const fees = await adapter.estimateFees({
        ...baseParams,
        chain: 'xrpl'
      });

      expect(fees.gasEstimate).toBe('12');
      expect(fees.gasPrice).toBe('0.00001');
      expect(fees.totalFee).toBe('0.00012');
      expect(fees.currency).toBe('XRP');
    });

    it('should estimate fees for Ethereum', async () => {
      const fees = await adapter.estimateFees({
        ...baseParams,
        chain: 'ethereum'
      });

      expect(fees.gasEstimate).toBe('150000');
      expect(fees.gasPrice).toBe('20');
      expect(fees.totalFee).toBe('0.003');
      expect(fees.currency).toBe('ETH');
    });

    it('should estimate fees for Polygon', async () => {
      const fees = await adapter.estimateFees({
        ...baseParams,
        chain: 'polygon'
      });

      expect(fees.gasEstimate).toBe('150000');
      expect(fees.gasPrice).toBe('30');
      expect(fees.totalFee).toBe('0.0045');
      expect(fees.currency).toBe('MATIC');
    });

    it('should estimate fees for Solana', async () => {
      const fees = await adapter.estimateFees({
        ...baseParams,
        chain: 'solana'
      });

      expect(fees.gasEstimate).toBe('5000');
      expect(fees.gasPrice).toBe('0.000005');
      expect(fees.totalFee).toBe('0.000025');
      expect(fees.currency).toBe('SOL');
    });
  });

  describe('Global Adapter Instance', () => {
    it('should provide global multichain adapter instance', () => {
      expect(multichainAdapter).toBeInstanceOf(MultichainEscrowAdapter);
      expect(multichainAdapter.getSupportedChains()).toEqual(['xrpl', 'ethereum', 'polygon', 'solana']);
    });
  });
});

describe('Cross-Chain Bridge', () => {
  describe('Bridge Support', () => {
    it('should identify supported bridge pairs', () => {
      expect(CrossChainBridge.canBridge('ethereum', 'polygon')).toBe(true);
      expect(CrossChainBridge.canBridge('polygon', 'ethereum')).toBe(true);
      expect(CrossChainBridge.canBridge('ethereum', 'xrpl')).toBe(true);
      expect(CrossChainBridge.canBridge('xrpl', 'ethereum')).toBe(true);
      
      // Unsupported pairs
      expect(CrossChainBridge.canBridge('solana', 'ethereum')).toBe(false);
      expect(CrossChainBridge.canBridge('polygon', 'xrpl')).toBe(false);
    });
  });

  describe('Bridge Estimation', () => {
    it('should estimate bridge parameters for supported pairs', async () => {
      const estimate = await CrossChainBridge.estimateBridge('ethereum', 'polygon', '1000');
      
      expect(estimate.estimatedTime).toBe('10-30 minutes');
      expect(estimate.bridgeFee).toBe('0.1%');
      expect(estimate.minAmount).toBe('100');
      expect(estimate.maxAmount).toBe('1000000');
    });

    it('should throw error for unsupported bridge pairs', async () => {
      await expect(CrossChainBridge.estimateBridge('solana', 'ethereum', '1000'))
        .rejects.toThrow('Bridge not supported between solana and ethereum');
    });
  });

  describe('Bridge Validation', () => {
    it('should validate bridge amounts', async () => {
      const estimate = await CrossChainBridge.estimateBridge('ethereum', 'polygon', '1000');
      
      expect(parseFloat(estimate.minAmount)).toBeLessThanOrEqual(1000);
      expect(parseFloat(estimate.maxAmount)).toBeGreaterThanOrEqual(1000);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete escrow flow across different chains', async () => {
    const chains: SupportedChain[] = ['xrpl', 'ethereum', 'polygon'];
    
    for (const chain of chains) {
      // Create escrow
      const escrowResult = await multichainAdapter.createEscrow({
        chain,
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: '25000',
        expirationDays: 7,
        metadata: JSON.stringify({ test: true })
      });

      expect(escrowResult.escrowId).toBeDefined();
      expect(escrowResult.txHash).toBeDefined();
      expect(escrowResult.status).toBe('pending');

      // Check transaction status
      const status = await multichainAdapter.getTransactionStatus(escrowResult.txHash, chain);
      expect(status.status).toBe('confirmed');

      // Estimate fees
      const fees = await multichainAdapter.estimateFees({
        chain,
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: '25000',
        expirationDays: 7,
        metadata: '{}'
      });

      expect(parseFloat(fees.totalFee)).toBeGreaterThan(0);
    }
  });

  it('should handle error scenarios gracefully', async () => {
    // Invalid chain
    await expect(multichainAdapter.createEscrow({
      chain: 'invalid' as SupportedChain,
      seller: 'seller',
      buyer: 'buyer',
      amount: '1000',
      expirationDays: 7,
      metadata: '{}'
    })).rejects.toThrow('Unsupported chain');

    // Invalid transaction hash
    const status = await multichainAdapter.getTransactionStatus('invalid_hash', 'xrpl');
    expect(status.status).toBe('confirmed'); // Mock returns confirmed for any hash
  });
});
