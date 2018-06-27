'use strict';
import Session from "../models/network/Session";

export default function session({ network = undefined, close = false, timeout = undefined }) {
  if ((!network && !close) || (network && close)) throw Error('Please provide either --network <network> or --close.')
  close ? Session.close() : Session.open(network, timeout)
}
