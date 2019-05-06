import BN from 'bignumber.js';
import web3Utils from 'web3-utils';

export function isValidUnit(unit: string): boolean {
  return Object.keys(web3Utils.unitMap).includes(unit.toLowerCase());
}

export function prettifyTokenAmount(amount: string, decimals?: string, symbol?: string): string {
  const prettifiedAmount = decimals
    ? new BN(amount).shiftedBy(-decimals).toFormat()
    : amount;

  return symbol ? `${prettifiedAmount} ${symbol}` : prettifiedAmount;
}

export function toWei(value: string, unit: any): string {
  return web3Utils.toWei(value, unit);
}

export function fromWei(value: string, unit: any): string {
  return web3Utils.fromWei(value, unit);
}
