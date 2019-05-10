import ZWeb3 from '../artifacts/ZWeb3';
import { toAddress } from '../utils/Addresses';

export default class MinimalProxy {
  public address: string;

  public static at(address: string): MinimalProxy {
    return new this(address);
  }

  constructor(address: string) {
    this.address = toAddress(address);
  }

  public async implementation(): Promise<string> {
    const code = await ZWeb3.getCode(this.address);
    return `0x${code.slice(22, 62)}`;
  }
}
