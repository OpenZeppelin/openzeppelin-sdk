'use strict';
import Session from "../models/network/Session";

export default function session({ network, from, timeout, close = false, expires }) {
  const anyNetworkOption = network || from || timeout;
  if (!!anyNetworkOption === !!close) {
    throw Error('Please provide either a network option (--network, --timeout, --from) or --close.')
  }
  close ? Session.close() : Session.open({ network, from, timeout }, expires)
}
