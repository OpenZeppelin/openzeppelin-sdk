// TS-TODO: Several web3 typings here...
export default function decodeLogs(logs: any[], contract: any): any[] {

  const SolidityEvent: any = require('web3/lib/web3/event.js');
  const decodedLogs: any[] = [];

  for (const log of logs) {
    const eventName: string = log.topics[0];
    if (eventName in contract.events) {
      const eventType: any = new SolidityEvent(null, contract.events[eventName], '0x0');
      decodedLogs.push(eventType.decode(log));
    }
  }

  return decodedLogs;
}
