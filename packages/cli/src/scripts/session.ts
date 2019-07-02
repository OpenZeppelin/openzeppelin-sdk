import Session from '../models/network/Session';
import { SessionParams } from './interfaces';

export default function session({ network, from, timeout, close = false, expires }: SessionParams): void | never {
  const anyNetworkOption = network || from || timeout;
  if (!!anyNetworkOption === !!close) {
    throw Error('Please provide either a network option (--network, --timeout, --from) or --close.');
  }
  close ? Session.close() : Session.open({ network, from, timeout }, expires);
}
