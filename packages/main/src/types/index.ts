/**
 * Re-export standardized contracts from contracts.ts
 * This ensures consistency across the entire application
 */
export * from './contracts';

/**
 * Additional types for internal use
 */
export interface EventBatch {
  events: NormalizedEvent[];
  timestamp: number;
}

import { NormalizedEvent, RoomStatus } from './contracts';
