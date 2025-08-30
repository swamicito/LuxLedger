import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

// XRPL Client Configuration
export const XRPL_CONFIG = {
  TESTNET_URL: 'wss://s.altnet.rippletest.net:51233',
  MAINNET_URL: 'wss://xrplcluster.com',
  NETWORK: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
};

// Asset Types for LuxLedger
export enum AssetType {
  REAL_ESTATE = 'REAL_ESTATE',
  JEWELRY = 'JEWELRY',
  EXOTIC_CAR = 'EXOTIC_CAR',
  WATCH = 'WATCH',
  ART = 'ART',
}

// Asset Token Configuration
export interface AssetToken {
  id: string;
  type: AssetType;
  name: string;
  symbol: string;
  issuer: string;
  totalSupply: string;
  currentPrice: string;
  metadata: {
    description: string;
    image: string;
    location?: string;
    certification?: string;
    appraisal?: string;
  };
}

// XRPL Client Class
export class XRPLClient {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    const serverUrl = XRPL_CONFIG.NETWORK === 'mainnet' 
      ? XRPL_CONFIG.MAINNET_URL 
      : XRPL_CONFIG.TESTNET_URL;
    
    this.client = new Client(serverUrl);
  }

  // Connect to XRPL
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log(`Connected to XRPL ${XRPL_CONFIG.NETWORK}`);
    }
  }

  // Disconnect from XRPL
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('Disconnected from XRPL');
    }
  }

  // Get account balance
  async getAccountBalance(address: string): Promise<string> {
    await this.connect();
    
    try {
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });
      
      return dropsToXrp(response.result.account_data.Balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch account balance');
    }
  }

  // Get account trustlines (for asset tokens)
  async getAccountTrustlines(address: string): Promise<any[]> {
    await this.connect();
    
    try {
      const response = await this.client.request({
        command: 'account_lines',
        account: address,
        ledger_index: 'validated'
      });
      
      return response.result.lines || [];
    } catch (error) {
      console.error('Error fetching trustlines:', error);
      return [];
    }
  }

  // Create trustline for asset token
  async createTrustline(
    walletSeed: string, 
    tokenCurrency: string, 
    issuerAddress: string, 
    limit: string = '1000000000'
  ): Promise<string> {
    await this.connect();
    
    try {
      const wallet = Wallet.fromSeed(walletSeed);
      
      const trustlineTransaction = {
        TransactionType: 'TrustSet',
        Account: wallet.address,
        LimitAmount: {
          currency: tokenCurrency,
          issuer: issuerAddress,
          value: limit
        }
      };

      const prepared = await this.client.autofill(trustlineTransaction);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      return result.result.hash;
    } catch (error) {
      console.error('Error creating trustline:', error);
      throw new Error('Failed to create trustline');
    }
  }

  // Issue asset token (for real estate - fungible tokens)
  async issueAssetToken(
    issuerSeed: string,
    recipientAddress: string,
    tokenCurrency: string,
    amount: string
  ): Promise<string> {
    await this.connect();
    
    try {
      const issuerWallet = Wallet.fromSeed(issuerSeed);
      
      const paymentTransaction = {
        TransactionType: 'Payment',
        Account: issuerWallet.address,
        Destination: recipientAddress,
        Amount: {
          currency: tokenCurrency,
          issuer: issuerWallet.address,
          value: amount
        }
      };

      const prepared = await this.client.autofill(paymentTransaction);
      const signed = issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      return result.result.hash;
    } catch (error) {
      console.error('Error issuing token:', error);
      throw new Error('Failed to issue asset token');
    }
  }

  // Mint NFT (for jewelry, cars, watches)
  async mintNFT(
    minterSeed: string,
    tokenTaxon: number,
    uri?: string,
    flags?: number
  ): Promise<string> {
    await this.connect();
    
    try {
      const minterWallet = Wallet.fromSeed(minterSeed);
      
      const nftMintTransaction: any = {
        TransactionType: 'NFTokenMint',
        Account: minterWallet.address,
        TokenTaxon: tokenTaxon,
        Flags: flags || 8, // tfTransferable
      };

      if (uri) {
        nftMintTransaction.URI = Buffer.from(uri, 'utf8').toString('hex').toUpperCase();
      }

      const prepared = await this.client.autofill(nftMintTransaction);
      const signed = minterWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      return result.result.hash;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw new Error('Failed to mint NFT');
    }
  }

  // Create sell offer for NFT
  async createNFTSellOffer(
    sellerSeed: string,
    nftTokenId: string,
    amount: string,
    destination?: string
  ): Promise<string> {
    await this.connect();
    
    try {
      const sellerWallet = Wallet.fromSeed(sellerSeed);
      
      const sellOfferTransaction: any = {
        TransactionType: 'NFTokenCreateOffer',
        Account: sellerWallet.address,
        NFTokenID: nftTokenId,
        Amount: xrpToDrops(amount),
        Flags: 1, // tfSellToken
      };

      if (destination) {
        sellOfferTransaction.Destination = destination;
      }

      const prepared = await this.client.autofill(sellOfferTransaction);
      const signed = sellerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      return result.result.hash;
    } catch (error) {
      console.error('Error creating NFT sell offer:', error);
      throw new Error('Failed to create NFT sell offer');
    }
  }

  // Accept NFT buy offer
  async acceptNFTOffer(
    buyerSeed: string,
    sellOfferIndex: string
  ): Promise<string> {
    await this.connect();
    
    try {
      const buyerWallet = Wallet.fromSeed(buyerSeed);
      
      const acceptOfferTransaction = {
        TransactionType: 'NFTokenAcceptOffer',
        Account: buyerWallet.address,
        NFTokenSellOffer: sellOfferIndex,
      };

      const prepared = await this.client.autofill(acceptOfferTransaction);
      const signed = buyerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      return result.result.hash;
    } catch (error) {
      console.error('Error accepting NFT offer:', error);
      throw new Error('Failed to accept NFT offer');
    }
  }

  // Get account NFTs
  async getAccountNFTs(address: string): Promise<any[]> {
    await this.connect();
    
    try {
      const response = await this.client.request({
        command: 'account_nfts',
        account: address,
        ledger_index: 'validated'
      });
      
      return response.result.account_nfts || [];
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<any> {
    await this.connect();
    
    try {
      const response = await this.client.request({
        command: 'tx',
        transaction: txHash,
      });
      
      return response.result;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction details');
    }
  }

  // Validate address
  isValidAddress(address: string): boolean {
    try {
      return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const xrplClient = new XRPLClient();

// Utility functions
export const formatXRPAmount = (drops: string): string => {
  return `${dropsToXrp(drops)} XRP`;
};

export const formatAssetAmount = (value: string, currency: string): string => {
  return `${parseFloat(value).toLocaleString()} ${currency}`;
};

// Asset token generators
export const generateAssetSymbol = (type: AssetType, id: string): string => {
  const prefixes = {
    [AssetType.REAL_ESTATE]: 'RE',
    [AssetType.JEWELRY]: 'JW',
    [AssetType.EXOTIC_CAR]: 'EC',
    [AssetType.WATCH]: 'WA',
    [AssetType.ART]: 'AR',
  };
  
  return `${prefixes[type]}${id.slice(-6).toUpperCase()}`;
};
