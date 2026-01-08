/**
 * LuxLedger Shipping Module - Type Definitions
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE PHILOSOPHY (NON-NEGOTIABLE)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. LuxLedger NEVER physically touches the asset
 * 2. LuxLedger orchestrates trust, verification, escrow, and proof — not trucks
 * 3. This is Airbnb + Stripe for luxury assets, NOT FedEx
 * 4. Sellers manage shipping; LuxLedger tracks and verifies
 * 5. Escrow releases only when: tracking=delivered AND (buyer confirms OR dispute window expires)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ============================================================================
// SHIPPING TIERS (Scalable Model)
// ============================================================================

export type ShippingTier = 'seller_managed' | 'verified_logistics' | 'custodial_escrow';

// ============================================================================
// SHIPMENT STATUS (Clean State Machine)
// ============================================================================

export type ShipmentStatus = 
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'disputed'
  | 'cancelled';

// ============================================================================
// APPROVED CARRIERS
// ============================================================================

export type ApprovedCarrier = 
  | 'fedex'
  | 'ups'
  | 'dhl'
  | 'brinks'
  | 'malca_amit'
  | 'enclosed_auto'
  | 'art_logistics'
  | 'other';

// ============================================================================
// ITEM CATEGORIES
// ============================================================================

export type ItemCategory = 
  | 'jewelry'
  | 'watches'
  | 'art'
  | 'cars'
  | 'wine'
  | 'collectibles'
  | 'real_estate';

// ============================================================================
// CORE SHIPMENT MODEL
// ============================================================================

export interface Shipment {
  id: string;
  escrow_id: string;
  carrier: ApprovedCarrier;
  carrier_name: string;
  tracking_number: string;
  declared_value: number;
  insured_value: number;
  insurance_confirmed: boolean;
  status: ShipmentStatus;
  proof_documents: ProofDocument[];
  created_at: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  confirmed_at?: Date;
  dispute_window_ends?: Date;
}

export interface ProofDocument {
  id: string;
  type: 'insurance_certificate' | 'shipping_receipt' | 'delivery_photo' | 'signature' | 'bill_of_lading' | 'other';
  url: string;
  filename: string;
  uploaded_at: Date;
  description?: string;
}

// ============================================================================
// ESCROW RELEASE CONDITIONS
// ============================================================================

export interface EscrowReleaseConditions {
  tracking_delivered: boolean;
  buyer_confirmed: boolean;
  dispute_window_expired: boolean;
  dispute_active: boolean;
  seller_failed_sla: boolean;
}

export const DISPUTE_WINDOW_HOURS = 72;
export const SHIPPING_SLA_DAYS = 5;

// ============================================================================
// CARRIER CONFIGURATION
// ============================================================================

export interface CarrierInfo {
  code: ApprovedCarrier;
  name: string;
  trackingUrlTemplate: string;
  maxDeclaredValue: number;
  requiresInsuranceProof: boolean;
  supportedCategories: ItemCategory[];
}

export const APPROVED_CARRIERS: Record<ApprovedCarrier, CarrierInfo> = {
  fedex: {
    code: 'fedex',
    name: 'FedEx',
    trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
    maxDeclaredValue: 100000,
    requiresInsuranceProof: true,
    supportedCategories: ['jewelry', 'watches', 'collectibles', 'wine', 'art'],
  },
  ups: {
    code: 'ups',
    name: 'UPS',
    trackingUrlTemplate: 'https://www.ups.com/track?tracknum={tracking}',
    maxDeclaredValue: 70000,
    requiresInsuranceProof: true,
    supportedCategories: ['jewelry', 'watches', 'collectibles', 'wine', 'art'],
  },
  dhl: {
    code: 'dhl',
    name: 'DHL',
    trackingUrlTemplate: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking}',
    maxDeclaredValue: 50000,
    requiresInsuranceProof: true,
    supportedCategories: ['jewelry', 'watches', 'collectibles', 'art'],
  },
  brinks: {
    code: 'brinks',
    name: 'Brink\'s Global Services',
    trackingUrlTemplate: 'https://www.brinksglobal.com/track/{tracking}',
    maxDeclaredValue: 10000000,
    requiresInsuranceProof: false,
    supportedCategories: ['jewelry', 'watches'],
  },
  malca_amit: {
    code: 'malca_amit',
    name: 'Malca-Amit',
    trackingUrlTemplate: 'https://www.malca-amit.com/track/{tracking}',
    maxDeclaredValue: 50000000,
    requiresInsuranceProof: false,
    supportedCategories: ['jewelry', 'watches', 'art'],
  },
  enclosed_auto: {
    code: 'enclosed_auto',
    name: 'Enclosed Auto Transport',
    trackingUrlTemplate: '',
    maxDeclaredValue: 5000000,
    requiresInsuranceProof: true,
    supportedCategories: ['cars'],
  },
  art_logistics: {
    code: 'art_logistics',
    name: 'Fine Art Logistics',
    trackingUrlTemplate: '',
    maxDeclaredValue: 50000000,
    requiresInsuranceProof: true,
    supportedCategories: ['art'],
  },
  other: {
    code: 'other',
    name: 'Other Carrier',
    trackingUrlTemplate: '',
    maxDeclaredValue: 10000,
    requiresInsuranceProof: true,
    supportedCategories: [],
  },
};

// ============================================================================
// CATEGORY REQUIREMENTS
// ============================================================================

export interface CategoryRequirements {
  category: ItemCategory;
  approvedCarriers: ApprovedCarrier[];
  requiresSignature: boolean;
  requiresInsurance: boolean;
  minInsurancePercent: number;
  disputeWindowHours: number;
  shippingSLADays: number;
  verifiedLogisticsThreshold: number;
  handlingNotes: string;
}

export const CATEGORY_REQUIREMENTS: Record<ItemCategory, CategoryRequirements> = {
  jewelry: {
    category: 'jewelry',
    approvedCarriers: ['fedex', 'ups', 'dhl', 'brinks', 'malca_amit'],
    requiresSignature: true,
    requiresInsurance: true,
    minInsurancePercent: 100,
    disputeWindowHours: 72,
    shippingSLADays: 3,
    verifiedLogisticsThreshold: 25000,
    handlingNotes: 'Discreet packaging required. No value declaration on exterior.',
  },
  watches: {
    category: 'watches',
    approvedCarriers: ['fedex', 'ups', 'dhl', 'brinks', 'malca_amit'],
    requiresSignature: true,
    requiresInsurance: true,
    minInsurancePercent: 100,
    disputeWindowHours: 72,
    shippingSLADays: 3,
    verifiedLogisticsThreshold: 25000,
    handlingNotes: 'Include all boxes, papers, and accessories.',
  },
  art: {
    category: 'art',
    approvedCarriers: ['fedex', 'ups', 'art_logistics', 'malca_amit'],
    requiresSignature: true,
    requiresInsurance: true,
    minInsurancePercent: 100,
    disputeWindowHours: 120,
    shippingSLADays: 7,
    verifiedLogisticsThreshold: 25000,
    handlingNotes: 'Professional crating required for items over $10,000.',
  },
  cars: {
    category: 'cars',
    approvedCarriers: ['enclosed_auto'],
    requiresSignature: true,
    requiresInsurance: true,
    minInsurancePercent: 100,
    disputeWindowHours: 168,
    shippingSLADays: 14,
    verifiedLogisticsThreshold: 50000,
    handlingNotes: 'Enclosed transport required. Bill of Lading with condition photos mandatory.',
  },
  wine: {
    category: 'wine',
    approvedCarriers: ['fedex', 'ups'],
    requiresSignature: true,
    requiresInsurance: true,
    minInsurancePercent: 100,
    disputeWindowHours: 48,
    shippingSLADays: 3,
    verifiedLogisticsThreshold: 10000,
    handlingNotes: 'Temperature-controlled shipping. Adult signature required.',
  },
  collectibles: {
    category: 'collectibles',
    approvedCarriers: ['fedex', 'ups', 'dhl'],
    requiresSignature: true,
    requiresInsurance: true,
    minInsurancePercent: 100,
    disputeWindowHours: 72,
    shippingSLADays: 5,
    verifiedLogisticsThreshold: 25000,
    handlingNotes: 'Include certificate of authenticity if applicable.',
  },
  real_estate: {
    category: 'real_estate',
    approvedCarriers: [],
    requiresSignature: false,
    requiresInsurance: false,
    minInsurancePercent: 0,
    disputeWindowHours: 720,
    shippingSLADays: 30,
    verifiedLogisticsThreshold: 0,
    handlingNotes: 'Title transfer only. No physical shipping.',
  },
};

// ============================================================================
// SHIPPING TIER CONFIGURATION
// ============================================================================

export interface ShippingTierConfig {
  tier: ShippingTier;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  features: string[];
  available: boolean;
}

export const SHIPPING_TIERS: ShippingTierConfig[] = [
  {
    tier: 'seller_managed',
    name: 'Standard Shipping',
    description: 'Seller ships via approved carriers with tracking and insurance',
    minValue: 0,
    maxValue: 25000,
    features: [
      'Seller selects from approved carriers',
      'Mandatory tracking number',
      'Insurance confirmation required',
      'Escrow releases on delivery confirmation',
    ],
    available: true,
  },
  {
    tier: 'verified_logistics',
    name: 'LuxLedger Verified Shipping',
    description: 'White-glove logistics with chain-of-custody verification',
    minValue: 25000,
    maxValue: 500000,
    features: [
      'Third-party logistics partner',
      'Chain-of-custody documentation',
      'Signature + ID verification',
      'Professional handling',
    ],
    available: true,
  },
  {
    tier: 'custodial_escrow',
    name: 'Custodial Verification',
    description: 'Asset verified by authentication partner before release',
    minValue: 500000,
    maxValue: Infinity,
    features: [
      'Ship to authentication partner',
      'Professional verification',
      'Vault storage option',
      'Verified by LuxLedger custody partners',
    ],
    available: false,
  },
];

// ============================================================================
// TIMELINE EVENTS
// ============================================================================

export type TimelineEventType = 
  | 'escrow_locked'
  | 'preparing_shipment'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'dispute_window_open'
  | 'buyer_confirmed'
  | 'dispute_filed'
  | 'funds_released'
  | 'cancelled';

export interface TimelineEvent {
  type: TimelineEventType;
  label: string;
  description: string;
  timestamp?: Date;
  completed: boolean;
  current: boolean;
  actionRequired?: boolean;
}

// ============================================================================
// TRACKING INFO
// ============================================================================

export interface TrackingUpdate {
  timestamp: Date;
  status: string;
  location?: string;
  details?: string;
}

export interface TrackingInfo {
  carrier: ApprovedCarrier;
  tracking_number: string;
  current_status: ShipmentStatus;
  status_detail: string;
  shipped_at?: Date;
  estimated_delivery?: Date;
  delivered_at?: Date;
  signed_by?: string;
  delivery_location?: string;
  updates: TrackingUpdate[];
  last_fetched: Date;
}

// ============================================================================
// TRUST LANGUAGE CONSTANTS
// ============================================================================

export const TRUST_COPY = {
  ESCROW_LOCKED: 'Your funds are securely locked in blockchain escrow.',
  ESCROW_PROTECTED: 'Funds remain in escrow until delivery is confirmed.',
  ESCROW_RELEASE: 'The seller will receive payment after you confirm receipt.',
  SELLER_SHIPS: 'The seller will ship the item to the verified destination.',
  SELLER_RESPONSIBLE: 'Seller is responsible for insured shipping to your verified address.',
  APPROVED_CARRIERS: 'Insured, tracked delivery via approved carriers.',
  DISPUTE_WINDOW: 'You have {hours} hours to inspect the item and report any issues.',
  DISPUTE_PROTECTION: 'Your funds remain protected during the dispute process.',
  CHAIN_OF_CUSTODY: 'Chain-of-custody available for high-value assets.',
  VERIFIED_LOGISTICS: 'White-glove logistics with signature verification.',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getCarrierInfo(code: ApprovedCarrier): CarrierInfo {
  return APPROVED_CARRIERS[code];
}

export function getTrackingUrl(carrier: ApprovedCarrier, trackingNumber: string): string {
  const info = APPROVED_CARRIERS[carrier];
  if (!info.trackingUrlTemplate) return '';
  return info.trackingUrlTemplate.replace('{tracking}', trackingNumber);
}

export function getCategoryRequirements(category: ItemCategory): CategoryRequirements {
  return CATEGORY_REQUIREMENTS[category];
}

export function getApprovedCarriersForCategory(category: ItemCategory): CarrierInfo[] {
  const requirements = CATEGORY_REQUIREMENTS[category];
  return requirements.approvedCarriers.map(code => APPROVED_CARRIERS[code]);
}

export function getRecommendedTier(itemValue: number): ShippingTier {
  if (itemValue >= 500000) return 'custodial_escrow';
  if (itemValue >= 25000) return 'verified_logistics';
  return 'seller_managed';
}

export function getShippingDeadline(createdAt: Date, category: ItemCategory): Date {
  const requirements = CATEGORY_REQUIREMENTS[category];
  const deadline = new Date(createdAt);
  deadline.setDate(deadline.getDate() + requirements.shippingSLADays);
  return deadline;
}

export function getDisputeWindowEnd(deliveredAt: Date, category: ItemCategory): Date {
  const requirements = CATEGORY_REQUIREMENTS[category];
  const windowEnd = new Date(deliveredAt);
  windowEnd.setHours(windowEnd.getHours() + requirements.disputeWindowHours);
  return windowEnd;
}

export function canReleaseEscrow(conditions: EscrowReleaseConditions): boolean {
  if (conditions.dispute_active) return false;
  if (conditions.seller_failed_sla) return false;
  if (!conditions.tracking_delivered) return false;
  return conditions.buyer_confirmed || conditions.dispute_window_expired;
}

export function isWithinDisputeWindow(deliveredAt: Date, category: ItemCategory): boolean {
  const windowEnd = getDisputeWindowEnd(deliveredAt, category);
  return new Date() < windowEnd;
}

export function getHoursRemainingInDisputeWindow(deliveredAt: Date, category: ItemCategory): number {
  const windowEnd = getDisputeWindowEnd(deliveredAt, category);
  const now = new Date();
  const diffMs = windowEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
}

export function isShippingOverdue(createdAt: Date, category: ItemCategory, status: ShipmentStatus): boolean {
  if (status !== 'pending') return false;
  const deadline = getShippingDeadline(createdAt, category);
  return new Date() > deadline;
}

export function getDaysUntilShippingDeadline(createdAt: Date, category: ItemCategory): number {
  const deadline = getShippingDeadline(createdAt, category);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function buildTimelineEvents(
  shipment: Shipment | null,
  escrowCreatedAt: Date,
  category: ItemCategory
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  events.push({
    type: 'escrow_locked',
    label: 'Payment Locked in Escrow',
    description: TRUST_COPY.ESCROW_LOCKED,
    timestamp: escrowCreatedAt,
    completed: true,
    current: false,
  });
  
  const isPending = !shipment || shipment.status === 'pending';
  events.push({
    type: 'preparing_shipment',
    label: 'Seller Preparing Shipment',
    description: TRUST_COPY.SELLER_SHIPS,
    timestamp: shipment?.created_at,
    completed: !isPending,
    current: isPending,
    actionRequired: isPending,
  });
  
  const isInTransit = shipment?.status === 'in_transit';
  const hasShipped = shipment && ['in_transit', 'delivered', 'confirmed'].includes(shipment.status);
  events.push({
    type: 'in_transit',
    label: shipment?.tracking_number ? `In Transit (${shipment.tracking_number})` : 'In Transit',
    description: 'Package is on its way to you.',
    timestamp: shipment?.shipped_at,
    completed: hasShipped && !isInTransit,
    current: isInTransit,
  });
  
  const isDelivered = shipment?.status === 'delivered';
  const wasDelivered = shipment && ['delivered', 'confirmed'].includes(shipment.status);
  events.push({
    type: 'delivered',
    label: 'Delivered',
    description: 'Package has been delivered.',
    timestamp: shipment?.delivered_at,
    completed: wasDelivered && !isDelivered,
    current: isDelivered,
  });
  
  if (isDelivered && shipment?.delivered_at) {
    const hoursRemaining = getHoursRemainingInDisputeWindow(shipment.delivered_at, category);
    events.push({
      type: 'dispute_window_open',
      label: 'Confirm Receipt or Report Issue',
      description: `You have ${hoursRemaining} hours to inspect and confirm.`,
      completed: false,
      current: true,
      actionRequired: true,
    });
  }
  
  const isConfirmed = shipment?.status === 'confirmed';
  events.push({
    type: 'funds_released',
    label: 'Funds Released to Seller',
    description: 'Transaction complete.',
    timestamp: shipment?.confirmed_at,
    completed: isConfirmed,
    current: false,
  });
  
  return events;
}
