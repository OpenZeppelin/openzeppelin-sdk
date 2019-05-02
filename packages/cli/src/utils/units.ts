import { ZWeb3 } from 'zos-lib';

export function isValidUnit(unit: string): boolean {
  return ZWeb3.getUnits().includes(unit.toLowerCase());
}
