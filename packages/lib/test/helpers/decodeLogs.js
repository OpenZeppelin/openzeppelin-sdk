const SolidityEvent = require('web3/lib/web3/event.js');

function decodeLogs (logs, contract) {
  return logs.map(log => {
    const event = new SolidityEvent(null, contract.events[log.topics[0]], '0x0');
    return event.decode(log);
  });
}

module.exports = decodeLogs
