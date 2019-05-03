import { ZWeb3 } from 'zos-lib';
import BN from 'bignumber.js';

export function isValidUnit(unit: string): boolean {
  return ZWeb3.getUnits().includes(unit.toLowerCase());
}

export function prettifyTokenAmount(amount: string, decimals?: string, symbol?: string): string {
  const prettifiedAmount = decimals
    ? new BN(amount).dividedBy(new BN(10).exponentiatedBy(decimals)).toFormat()
    : amount;

  return symbol ? `${prettifiedAmount} ${symbol}` : prettifiedAmount;
}
