import Session from '../models/network/Session';
import { SessionParams } from './interfaces';

export default function session({
  network,
  from,
  timeout,
  blockTimeout,
  close = false,
  expires,
}: SessionParams): void | never {
  const anyNetworkOption = network || from || timeout || blockTimeout;
  if (!!anyNetworkOption === !!close) {
    throw Error('Please provide either a network option (--network, --timeout, --blockTimeout, --from) or --close.');
  }
  close ? Session.close() : Session.open({ network, from, timeout, blockTimeout }, expires);
}
