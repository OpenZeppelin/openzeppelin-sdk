import ZWeb3 from '../artifacts/ZWeb3';
import { toAddress } from '../utils/Addresses';

export default class MinimalProxy {
  public address: string;

  public static at(address: string): MinimalProxy {
    return new this(address);
  }

  public constructor(address: string) {
    this.address = toAddress(address);
  }

  public async implementation(): Promise<string> {
    // Implementation address is in bytes 10-29
    // (see http://eips.ethereum.org/EIPS/eip-1167)
    // We are slicing on the hex representation, hence 2 chars per byte,
    // and have also to account for the initial 0x in the string
    const code = await ZWeb3.getCode(this.address);
    return `0x${code.slice(22, 62)}`;
  }
}
