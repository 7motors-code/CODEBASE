import { pkParts } from './format';
const p2 = (n: number) => String(n).padStart(2, '0');
function stamp(withSec = true) {
  const now = new Date();
  const p = pkParts(now);
  const s = p2(now.getUTCSeconds());
  return `${p.y}${p2(p.m)}${p2(p.d)}${p2(p.h)}${p2(p.min)}${withSec ? s : ''}`;
}
/** Cryptographically random hex (ids of private files must not be guessable) */
function hex(n = 4) {
  const bytes = new Uint8Array(Math.ceil(n / 2));
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, n).toUpperCase();
}
export const newBookingId = () => `BK-${stamp()}-${hex()}`;
export const newGroupId = () => `GRP-${stamp()}`;
export const newCustomerId = () => `C${stamp()}${hex()}`;
export const newMaintenanceId = () => `MT-${stamp(false)}-${hex()}`;
export const newDamageId = () => `DMG-${stamp(false)}-${hex()}`;
export const newExpenseId = () => `EXP-${stamp(false)}-${hex()}`;
export const newPaymentId = () => `PAY-${stamp()}-${hex()}`;
export const newFileId = () => `${Date.now().toString(36)}${hex(20).toLowerCase()}`;
