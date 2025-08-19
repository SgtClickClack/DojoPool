// Minimal shim for packages/types internal dependency used by game.ts
// This prevents TS2307 in the frontend when importing from packages/types.

export type VectorTimestamp = any;

declare const VectorClock: any;
export default VectorClock;
