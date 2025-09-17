// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LuxGuardEscrow
 * @dev Decentralized escrow contract for luxury asset transactions
 */
contract LuxGuardEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum EscrowStatus { Created, Funded, Released, Disputed, Resolved, Cancelled }
    enum DisputeStatus { None, Initiated, Voting, Resolved }

    struct Escrow {
        uint256 escrowId;
        address buyer;
        address seller;
        address token; // Address(0) for ETH
        uint256 amount;
        uint256 feeAmount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bool requiresBothParties;
        string assetMetadata; // IPFS hash or metadata
    }

    struct Dispute {
        uint256 disputeId;
        uint256 escrowId;
        address initiator;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        mapping(address => bool) hasVoted;
        mapping(address => uint8) votes; // 0: buyer, 1: seller, 2: split
        address[] arbitrators;
        uint256 buyerVotes;
        uint256 sellerVotes;
        uint256 splitVotes;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => bool) public authorizedArbitrators;
    
    uint256 public nextEscrowId = 1;
    uint256 public nextDisputeId = 1;
    uint256 public platformFeeRate = 250; // 2.5% in basis points
    address public feeRecipient;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event EscrowFunded(uint256 indexed escrowId);
    event EscrowReleased(uint256 indexed escrowId);
    event DisputeInitiated(uint256 indexed disputeId, uint256 indexed escrowId, address indexed initiator);
    event DisputeResolved(uint256 indexed disputeId, uint8 outcome);
    event ArbitratorAdded(address indexed arbitrator);
    event ArbitratorRemoved(address indexed arbitrator);

    modifier onlyParties(uint256 escrowId) {
        require(
            msg.sender == escrows[escrowId].buyer || 
            msg.sender == escrows[escrowId].seller,
            "Not authorized"
        );
        _;
    }

    modifier onlyArbitrator() {
        require(authorizedArbitrators[msg.sender], "Not an authorized arbitrator");
        _;
    }

    modifier escrowExists(uint256 escrowId) {
        require(escrows[escrowId].buyer != address(0), "Escrow does not exist");
        _;
    }

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new escrow
     */
    function createEscrow(
        address _seller,
        address _token,
        uint256 _amount,
        uint256 _expirationDays,
        bool _requiresBothParties,
        string calldata _assetMetadata
    ) external returns (uint256) {
        require(_seller != address(0), "Invalid seller address");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 escrowId = nextEscrowId++;
        uint256 feeAmount = (_amount * platformFeeRate) / 10000;

        escrows[escrowId] = Escrow({
            escrowId: escrowId,
            buyer: msg.sender,
            seller: _seller,
            token: _token,
            amount: _amount,
            feeAmount: feeAmount,
            status: EscrowStatus.Created,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (_expirationDays * 1 days),
            requiresBothParties: _requiresBothParties,
            assetMetadata: _assetMetadata
        });

        emit EscrowCreated(escrowId, msg.sender, _seller, _amount);
        return escrowId;
    }

    /**
     * @dev Fund the escrow (buyer deposits funds)
     */
    function fundEscrow(uint256 escrowId) external payable nonReentrant escrowExists(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can fund");
        require(escrow.status == EscrowStatus.Created, "Invalid escrow status");

        uint256 totalAmount = escrow.amount + escrow.feeAmount;

        if (escrow.token == address(0)) {
            // ETH payment
            require(msg.value == totalAmount, "Incorrect ETH amount");
        } else {
            // ERC20 payment
            require(msg.value == 0, "ETH not accepted for token payments");
            IERC20(escrow.token).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        escrow.status = EscrowStatus.Funded;
        emit EscrowFunded(escrowId);
    }

    /**
     * @dev Release funds to seller (can be called by buyer or both parties)
     */
    function releaseFunds(uint256 escrowId) external nonReentrant onlyParties(escrowId) escrowExists(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Funded, "Escrow not funded");
        require(block.timestamp <= escrow.expiresAt, "Escrow expired");

        if (escrow.requiresBothParties) {
            // Implementation for dual confirmation would go here
            // For simplicity, allowing buyer to release directly
            require(msg.sender == escrow.buyer, "Only buyer can release");
        }

        escrow.status = EscrowStatus.Released;

        // Transfer funds to seller
        if (escrow.token == address(0)) {
            payable(escrow.seller).transfer(escrow.amount);
            payable(feeRecipient).transfer(escrow.feeAmount);
        } else {
            IERC20(escrow.token).safeTransfer(escrow.seller, escrow.amount);
            IERC20(escrow.token).safeTransfer(feeRecipient, escrow.feeAmount);
        }

        emit EscrowReleased(escrowId);
    }

    /**
     * @dev Initiate a dispute
     */
    function initiateDispute(uint256 escrowId, string calldata reason) external onlyParties(escrowId) escrowExists(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Funded, "Invalid escrow status");

        uint256 disputeId = nextDisputeId++;
        Dispute storage dispute = disputes[disputeId];
        
        dispute.disputeId = disputeId;
        dispute.escrowId = escrowId;
        dispute.initiator = msg.sender;
        dispute.reason = reason;
        dispute.status = DisputeStatus.Initiated;
        dispute.createdAt = block.timestamp;

        escrow.status = EscrowStatus.Disputed;

        emit DisputeInitiated(disputeId, escrowId, msg.sender);
    }

    /**
     * @dev Vote on a dispute (arbitrators only)
     */
    function voteOnDispute(uint256 disputeId, uint8 vote) external onlyArbitrator {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Voting || dispute.status == DisputeStatus.Initiated, "Invalid dispute status");
        require(!dispute.hasVoted[msg.sender], "Already voted");
        require(vote <= 2, "Invalid vote");

        dispute.hasVoted[msg.sender] = true;
        dispute.votes[msg.sender] = vote;
        dispute.arbitrators.push(msg.sender);

        if (vote == 0) dispute.buyerVotes++;
        else if (vote == 1) dispute.sellerVotes++;
        else dispute.splitVotes++;

        dispute.status = DisputeStatus.Voting;

        // Check if we have enough votes to resolve (simplified: 3 votes minimum)
        if (dispute.arbitrators.length >= 3) {
            _resolveDispute(disputeId);
        }
    }

    /**
     * @dev Resolve dispute based on votes
     */
    function _resolveDispute(uint256 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        Escrow storage escrow = escrows[dispute.escrowId];

        uint8 outcome;
        if (dispute.buyerVotes > dispute.sellerVotes && dispute.buyerVotes > dispute.splitVotes) {
            outcome = 0; // Buyer wins
            if (escrow.token == address(0)) {
                payable(escrow.buyer).transfer(escrow.amount);
                payable(feeRecipient).transfer(escrow.feeAmount);
            } else {
                IERC20(escrow.token).safeTransfer(escrow.buyer, escrow.amount);
                IERC20(escrow.token).safeTransfer(feeRecipient, escrow.feeAmount);
            }
        } else if (dispute.sellerVotes > dispute.buyerVotes && dispute.sellerVotes > dispute.splitVotes) {
            outcome = 1; // Seller wins
            if (escrow.token == address(0)) {
                payable(escrow.seller).transfer(escrow.amount);
                payable(feeRecipient).transfer(escrow.feeAmount);
            } else {
                IERC20(escrow.token).safeTransfer(escrow.seller, escrow.amount);
                IERC20(escrow.token).safeTransfer(feeRecipient, escrow.feeAmount);
            }
        } else {
            outcome = 2; // Split
            uint256 halfAmount = escrow.amount / 2;
            if (escrow.token == address(0)) {
                payable(escrow.buyer).transfer(halfAmount);
                payable(escrow.seller).transfer(halfAmount);
                payable(feeRecipient).transfer(escrow.feeAmount);
            } else {
                IERC20(escrow.token).safeTransfer(escrow.buyer, halfAmount);
                IERC20(escrow.token).safeTransfer(escrow.seller, halfAmount);
                IERC20(escrow.token).safeTransfer(feeRecipient, escrow.feeAmount);
            }
        }

        dispute.status = DisputeStatus.Resolved;
        escrow.status = EscrowStatus.Resolved;

        emit DisputeResolved(disputeId, outcome);
    }

    /**
     * @dev Cancel expired escrow (refund to buyer)
     */
    function cancelExpiredEscrow(uint256 escrowId) external nonReentrant escrowExists(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Funded, "Invalid status");
        require(block.timestamp > escrow.expiresAt, "Not expired yet");

        escrow.status = EscrowStatus.Cancelled;

        // Refund to buyer (minus fee)
        if (escrow.token == address(0)) {
            payable(escrow.buyer).transfer(escrow.amount);
            payable(feeRecipient).transfer(escrow.feeAmount);
        } else {
            IERC20(escrow.token).safeTransfer(escrow.buyer, escrow.amount);
            IERC20(escrow.token).safeTransfer(feeRecipient, escrow.feeAmount);
        }
    }

    /**
     * @dev Add authorized arbitrator (owner only)
     */
    function addArbitrator(address arbitrator) external onlyOwner {
        authorizedArbitrators[arbitrator] = true;
        emit ArbitratorAdded(arbitrator);
    }

    /**
     * @dev Remove arbitrator (owner only)
     */
    function removeArbitrator(address arbitrator) external onlyOwner {
        authorizedArbitrators[arbitrator] = false;
        emit ArbitratorRemoved(arbitrator);
    }

    /**
     * @dev Update platform fee rate (owner only)
     */
    function updateFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Fee rate too high"); // Max 10%
        platformFeeRate = newRate;
    }

    /**
     * @dev Update fee recipient (owner only)
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }

    /**
     * @dev Get escrow details
     */
    function getEscrow(uint256 escrowId) external view returns (
        address buyer,
        address seller,
        address token,
        uint256 amount,
        uint256 feeAmount,
        EscrowStatus status,
        uint256 createdAt,
        uint256 expiresAt,
        bool requiresBothParties,
        string memory assetMetadata
    ) {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.buyer,
            escrow.seller,
            escrow.token,
            escrow.amount,
            escrow.feeAmount,
            escrow.status,
            escrow.createdAt,
            escrow.expiresAt,
            escrow.requiresBothParties,
            escrow.assetMetadata
        );
    }

    /**
     * @dev Get dispute details
     */
    function getDispute(uint256 disputeId) external view returns (
        uint256 escrowId,
        address initiator,
        string memory reason,
        DisputeStatus status,
        uint256 createdAt,
        uint256 buyerVotes,
        uint256 sellerVotes,
        uint256 splitVotes
    ) {
        Dispute storage dispute = disputes[disputeId];
        return (
            dispute.escrowId,
            dispute.initiator,
            dispute.reason,
            dispute.status,
            dispute.createdAt,
            dispute.buyerVotes,
            dispute.sellerVotes,
            dispute.splitVotes
        );
    }
}
