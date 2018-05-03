const SolidityEvent = require('web3/lib/web3/event.js');

export default function decodeLogs (logs, contract) {
  const decodedLogs = [];
  
  for (const log of logs) {
    const eventName = log.topics[0];
    if (eventName in contract.events) {
      const eventType = new SolidityEvent(null, contract.events[eventName], '0x0');
      decodedLogs.push(eventType.decode(log));
    }
  }
        
  return decodedLogs;
}
