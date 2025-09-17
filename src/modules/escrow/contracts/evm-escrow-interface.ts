/**
 * TypeScript interface for interacting with the LuxGuardEscrow smart contract
 */

import { ethers } from 'ethers';

export enum EscrowStatus {
  Created = 0,
  Funded = 1,
  Released = 2,
  Disputed = 3,
  Resolved = 4,
  Cancelled = 5
}

export enum DisputeStatus {
  None = 0,
  Initiated = 1,
  Voting = 2,
  Resolved = 3
}

export interface EVMEscrowParams {
  seller: string;
  token: string; // Address(0) for ETH
  amount: string;
  expirationDays: number;
  requiresBothParties: boolean;
  assetMetadata: string;
}

export interface EVMEscrowDetails {
  buyer: string;
  seller: string;
  token: string;
  amount: string;
  feeAmount: string;
  status: EscrowStatus;
  createdAt: number;
  expiresAt: number;
  requiresBothParties: boolean;
  assetMetadata: string;
}

export interface EVMDisputeDetails {
  escrowId: string;
  initiator: string;
  reason: string;
  status: DisputeStatus;
  createdAt: number;
  buyerVotes: number;
  sellerVotes: number;
  splitVotes: number;
}

export class EVMEscrowContract {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.signer = signer;
    
    // ABI for the LuxGuardEscrow contract (simplified)
    const abi = [
      "function createEscrow(address seller, address token, uint256 amount, uint256 expirationDays, bool requiresBothParties, string assetMetadata) returns (uint256)",
      "function fundEscrow(uint256 escrowId) payable",
      "function releaseFunds(uint256 escrowId)",
      "function initiateDispute(uint256 escrowId, string reason)",
      "function voteOnDispute(uint256 disputeId, uint8 vote)",
      "function cancelExpiredEscrow(uint256 escrowId)",
      "function getEscrow(uint256 escrowId) view returns (address, address, address, uint256, uint256, uint8, uint256, uint256, bool, string)",
      "function getDispute(uint256 disputeId) view returns (uint256, address, string, uint8, uint256, uint256, uint256, uint256)",
      "function authorizedArbitrators(address) view returns (bool)",
      "function platformFeeRate() view returns (uint256)",
      "event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount)",
      "event EscrowFunded(uint256 indexed escrowId)",
      "event EscrowReleased(uint256 indexed escrowId)",
      "event DisputeInitiated(uint256 indexed disputeId, uint256 indexed escrowId, address indexed initiator)",
      "event DisputeResolved(uint256 indexed disputeId, uint8 outcome)"
    ];

    this.contract = new ethers.Contract(contractAddress, abi, signer);
  }

  async createEscrow(params: EVMEscrowParams): Promise<{ escrowId: string; txHash: string }> {
    const tx = await this.contract.createEscrow(
      params.seller,
      params.token,
      params.amount,
      params.expirationDays,
      params.requiresBothParties,
      params.assetMetadata
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find((e: any) => e.event === 'EscrowCreated');
    const escrowId = event?.args?.escrowId.toString();

    return {
      escrowId,
      txHash: tx.hash
    };
  }

  async fundEscrow(escrowId: string, value?: string): Promise<string> {
    const tx = await this.contract.fundEscrow(escrowId, {
      value: value || '0'
    });
    await tx.wait();
    return tx.hash;
  }

  async releaseFunds(escrowId: string): Promise<string> {
    const tx = await this.contract.releaseFunds(escrowId);
    await tx.wait();
    return tx.hash;
  }

  async initiateDispute(escrowId: string, reason: string): Promise<{ disputeId: string; txHash: string }> {
    const tx = await this.contract.initiateDispute(escrowId, reason);
    const receipt = await tx.wait();
    
    const event = receipt.events?.find((e: any) => e.event === 'DisputeInitiated');
    const disputeId = event?.args?.disputeId.toString();

    return {
      disputeId,
      txHash: tx.hash
    };
  }

  async voteOnDispute(disputeId: string, vote: 0 | 1 | 2): Promise<string> {
    const tx = await this.contract.voteOnDispute(disputeId, vote);
    await tx.wait();
    return tx.hash;
  }

  async getEscrow(escrowId: string): Promise<EVMEscrowDetails> {
    const result = await this.contract.getEscrow(escrowId);
    
    return {
      buyer: result[0],
      seller: result[1],
      token: result[2],
      amount: result[3].toString(),
      feeAmount: result[4].toString(),
      status: result[5],
      createdAt: result[6].toNumber(),
      expiresAt: result[7].toNumber(),
      requiresBothParties: result[8],
      assetMetadata: result[9]
    };
  }

  async getDispute(disputeId: string): Promise<EVMDisputeDetails> {
    const result = await this.contract.getDispute(disputeId);
    
    return {
      escrowId: result[0].toString(),
      initiator: result[1],
      reason: result[2],
      status: result[3],
      createdAt: result[4].toNumber(),
      buyerVotes: result[5].toNumber(),
      sellerVotes: result[6].toNumber(),
      splitVotes: result[7].toNumber()
    };
  }

  async isAuthorizedArbitrator(address: string): Promise<boolean> {
    return await this.contract.authorizedArbitrators(address);
  }

  async getPlatformFeeRate(): Promise<number> {
    const rate = await this.contract.platformFeeRate();
    return rate.toNumber();
  }

  // Event listeners
  onEscrowCreated(callback: (escrowId: string, buyer: string, seller: string, amount: string) => void) {
    this.contract.on('EscrowCreated', callback);
  }

  onEscrowFunded(callback: (escrowId: string) => void) {
    this.contract.on('EscrowFunded', callback);
  }

  onEscrowReleased(callback: (escrowId: string) => void) {
    this.contract.on('EscrowReleased', callback);
  }

  onDisputeInitiated(callback: (disputeId: string, escrowId: string, initiator: string) => void) {
    this.contract.on('DisputeInitiated', callback);
  }

  onDisputeResolved(callback: (disputeId: string, outcome: number) => void) {
    this.contract.on('DisputeResolved', callback);
  }
}

// Factory function
export function createEVMEscrowContract(
  contractAddress: string, 
  signer: ethers.Signer
): EVMEscrowContract {
  return new EVMEscrowContract(contractAddress, signer);
}
