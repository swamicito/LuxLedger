/**
 * LuxLedger Shipping Service
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service orchestrates TRUST and VERIFICATION, not logistics.
 * - Sellers manage shipping
 * - LuxLedger tracks and verifies
 * - Escrow releases based on delivery + confirmation/window expiry
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  Shipment,
  ShipmentStatus,
  ApprovedCarrier,
  ItemCategory,
  ProofDocument,
  TrackingInfo,
  TrackingUpdate,
  EscrowReleaseConditions,
  TimelineEvent,
  APPROVED_CARRIERS,
  CATEGORY_REQUIREMENTS,
  getTrackingUrl,
  getShippingDeadline,
  getDisputeWindowEnd,
  canReleaseEscrow,
  isWithinDisputeWindow,
  getHoursRemainingInDisputeWindow,
  isShippingOverdue,
  buildTimelineEvents,
} from './types';

// ============================================================================
// SHIPMENT SERVICE
// ============================================================================

class ShipmentService {
  private shipments: Map<string, Shipment> = new Map();

  // --------------------------------------------------------------------------
  // CREATE SHIPMENT RECORD
  // --------------------------------------------------------------------------

  /**
   * Create a new shipment record when escrow is funded
   * Called automatically when buyer completes payment
   */
  createShipment(params: {
    escrowId: string;
    category: ItemCategory;
    itemValue: number;
  }): Shipment {
    const id = `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shipment: Shipment = {
      id,
      escrow_id: params.escrowId,
      carrier: 'other', // Will be set by seller
      carrier_name: '',
      tracking_number: '',
      declared_value: params.itemValue,
      insured_value: 0,
      insurance_confirmed: false,
      status: 'pending',
      proof_documents: [],
      created_at: new Date(),
    };

    this.shipments.set(id, shipment);
    return shipment;
  }

  // --------------------------------------------------------------------------
  // SELLER ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Seller adds shipping information
   * This is the primary seller action
   */
  async addShippingInfo(params: {
    shipmentId: string;
    carrier: ApprovedCarrier;
    carrierName?: string;
    trackingNumber: string;
    insuredValue: number;
    insuranceConfirmed: boolean;
  }): Promise<Shipment> {
    const shipment = this.shipments.get(params.shipmentId);
    if (!shipment) throw new Error('Shipment not found');
    if (shipment.status !== 'pending') throw new Error('Shipment already processed');

    // Validate carrier
    const carrierInfo = APPROVED_CARRIERS[params.carrier];
    if (!carrierInfo) throw new Error('Invalid carrier');

    // Update shipment
    shipment.carrier = params.carrier;
    shipment.carrier_name = params.carrierName || carrierInfo.name;
    shipment.tracking_number = params.trackingNumber.trim().toUpperCase();
    shipment.insured_value = params.insuredValue;
    shipment.insurance_confirmed = params.insuranceConfirmed;
    shipment.status = 'in_transit';
    shipment.shipped_at = new Date();

    return shipment;
  }

  /**
   * Seller uploads proof document
   */
  async uploadProofDocument(params: {
    shipmentId: string;
    type: ProofDocument['type'];
    url: string;
    filename: string;
    description?: string;
  }): Promise<Shipment> {
    const shipment = this.shipments.get(params.shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const doc: ProofDocument = {
      id: `doc_${Date.now()}`,
      type: params.type,
      url: params.url,
      filename: params.filename,
      uploaded_at: new Date(),
      description: params.description,
    };

    shipment.proof_documents.push(doc);
    return shipment;
  }

  // --------------------------------------------------------------------------
  // TRACKING UPDATES
  // --------------------------------------------------------------------------

  /**
   * Update shipment status from tracking
   * Called by tracking webhook or polling
   */
  async updateTrackingStatus(
    shipmentId: string,
    trackingInfo: TrackingInfo
  ): Promise<Shipment> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    // Map tracking status to shipment status
    if (trackingInfo.current_status === 'delivered' && shipment.status === 'in_transit') {
      shipment.status = 'delivered';
      shipment.delivered_at = trackingInfo.delivered_at || new Date();
      
      // Calculate dispute window end
      const category = this.getCategoryForShipment(shipmentId);
      if (category && shipment.delivered_at) {
        shipment.dispute_window_ends = getDisputeWindowEnd(shipment.delivered_at, category);
      }
    }

    return shipment;
  }

  /**
   * Mark as delivered (manual override or carrier confirmation)
   */
  async markAsDelivered(shipmentId: string, category: ItemCategory): Promise<Shipment> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found');
    if (shipment.status !== 'in_transit') throw new Error('Shipment not in transit');

    shipment.status = 'delivered';
    shipment.delivered_at = new Date();
    shipment.dispute_window_ends = getDisputeWindowEnd(shipment.delivered_at, category);

    return shipment;
  }

  // --------------------------------------------------------------------------
  // BUYER ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Buyer confirms receipt
   * This triggers escrow release
   */
  async confirmReceipt(shipmentId: string): Promise<Shipment> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found');
    if (shipment.status !== 'delivered') throw new Error('Shipment not yet delivered');

    shipment.status = 'confirmed';
    shipment.confirmed_at = new Date();

    return shipment;
  }

  /**
   * Buyer reports issue (initiates dispute)
   */
  async reportIssue(shipmentId: string): Promise<Shipment> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found');
    if (!['in_transit', 'delivered'].includes(shipment.status)) {
      throw new Error('Cannot dispute at this stage');
    }

    shipment.status = 'disputed';
    return shipment;
  }

  // --------------------------------------------------------------------------
  // ESCROW RELEASE LOGIC
  // --------------------------------------------------------------------------

  /**
   * Check if escrow can be released for a shipment
   * This is the CRITICAL business logic
   */
  checkEscrowRelease(shipmentId: string, category: ItemCategory): {
    canRelease: boolean;
    conditions: EscrowReleaseConditions;
    reason: string;
  } {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      return {
        canRelease: false,
        conditions: {
          tracking_delivered: false,
          buyer_confirmed: false,
          dispute_window_expired: false,
          dispute_active: false,
          seller_failed_sla: false,
        },
        reason: 'Shipment not found',
      };
    }

    // Build conditions
    const conditions: EscrowReleaseConditions = {
      tracking_delivered: shipment.status === 'delivered' || shipment.status === 'confirmed',
      buyer_confirmed: shipment.status === 'confirmed',
      dispute_window_expired: this.isDisputeWindowExpired(shipment, category),
      dispute_active: shipment.status === 'disputed',
      seller_failed_sla: isShippingOverdue(shipment.created_at, category, shipment.status),
    };

    const canRelease = canReleaseEscrow(conditions);

    // Determine reason
    let reason = '';
    if (canRelease) {
      reason = conditions.buyer_confirmed 
        ? 'Buyer confirmed receipt'
        : 'Dispute window expired without issues';
    } else if (conditions.dispute_active) {
      reason = 'Dispute in progress - escrow frozen';
    } else if (conditions.seller_failed_sla) {
      reason = 'Seller failed to ship within SLA';
    } else if (!conditions.tracking_delivered) {
      reason = 'Awaiting delivery confirmation';
    } else {
      reason = 'Within dispute window - awaiting buyer confirmation';
    }

    return { canRelease, conditions, reason };
  }

  /**
   * Process automatic escrow release when dispute window expires
   * Called by scheduled job
   */
  async processDisputeWindowExpiry(shipmentId: string, category: ItemCategory): Promise<{
    released: boolean;
    shipment: Shipment;
  }> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const { canRelease } = this.checkEscrowRelease(shipmentId, category);

    if (canRelease && shipment.status === 'delivered') {
      // Auto-confirm after dispute window
      shipment.status = 'confirmed';
      shipment.confirmed_at = new Date();
      return { released: true, shipment };
    }

    return { released: false, shipment };
  }

  // --------------------------------------------------------------------------
  // CANCELLATION
  // --------------------------------------------------------------------------

  /**
   * Cancel shipment (seller failed SLA or buyer request)
   */
  async cancelShipment(shipmentId: string, reason: string): Promise<Shipment> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) throw new Error('Shipment not found');
    if (['confirmed', 'cancelled'].includes(shipment.status)) {
      throw new Error('Cannot cancel at this stage');
    }

    shipment.status = 'cancelled';
    return shipment;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getShipment(shipmentId: string): Shipment | undefined {
    return this.shipments.get(shipmentId);
  }

  getShipmentByEscrow(escrowId: string): Shipment | undefined {
    return Array.from(this.shipments.values()).find(s => s.escrow_id === escrowId);
  }

  getTrackingUrl(shipment: Shipment): string {
    return getTrackingUrl(shipment.carrier, shipment.tracking_number);
  }

  // --------------------------------------------------------------------------
  // TIMELINE
  // --------------------------------------------------------------------------

  /**
   * Build timeline events for UI display
   */
  getTimeline(shipmentId: string, escrowCreatedAt: Date, category: ItemCategory): TimelineEvent[] {
    const shipment = this.shipments.get(shipmentId) || null;
    return buildTimelineEvents(shipment, escrowCreatedAt, category);
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private isDisputeWindowExpired(shipment: Shipment, category: ItemCategory): boolean {
    if (!shipment.delivered_at) return false;
    return !isWithinDisputeWindow(shipment.delivered_at, category);
  }

  private getCategoryForShipment(shipmentId: string): ItemCategory | null {
    // In production, this would look up the escrow to get category
    // For now, return null (caller should provide category)
    return null;
  }
}

// ============================================================================
// TRACKING SERVICE (Carrier API Integration)
// ============================================================================

class TrackingService {
  /**
   * Fetch tracking info from carrier API
   * In production, this would call actual carrier APIs
   */
  async fetchTrackingInfo(
    carrier: ApprovedCarrier,
    trackingNumber: string
  ): Promise<TrackingInfo | null> {
    const carrierInfo = APPROVED_CARRIERS[carrier];
    if (!carrierInfo) return null;

    // Simulate API call
    console.log(`Fetching tracking for ${carrier}: ${trackingNumber}`);

    // In production, implement actual carrier API calls here
    // For now, return simulated data
    const info: TrackingInfo = {
      carrier,
      tracking_number: trackingNumber,
      current_status: 'in_transit',
      status_detail: 'Package in transit',
      shipped_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      updates: [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'Picked up',
          location: 'Origin facility',
        },
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'In transit',
          location: 'Regional hub',
        },
      ],
      last_fetched: new Date(),
    };

    return info;
  }

  /**
   * Check if tracking shows delivered
   */
  async checkDeliveryStatus(
    carrier: ApprovedCarrier,
    trackingNumber: string
  ): Promise<{ delivered: boolean; deliveredAt?: Date; signedBy?: string }> {
    const info = await this.fetchTrackingInfo(carrier, trackingNumber);
    if (!info) return { delivered: false };

    return {
      delivered: info.current_status === 'delivered',
      deliveredAt: info.delivered_at,
      signedBy: info.signed_by,
    };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCES
// ============================================================================

export const shipmentService = new ShipmentService();
export const trackingService = new TrackingService();

// Also export classes for testing
export { ShipmentService, TrackingService };
