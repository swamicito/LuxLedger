/**
 * LuxLedger Shipping Module
 * 
 * CORE PHILOSOPHY:
 * - LuxLedger NEVER physically touches assets
 * - LuxLedger orchestrates trust, verification, escrow, and proof
 * - Sellers manage shipping; LuxLedger tracks and verifies
 * - Escrow releases when: tracking=delivered AND (buyer confirms OR dispute window expires)
 */

// Types
export * from './types';

// Services
export { shipmentService, trackingService, ShipmentService, TrackingService } from './shipping-service';

// Components
export * from './components';
