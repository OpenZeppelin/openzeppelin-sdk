// TS-TODO: use typed web3 stuff here

import assert from 'assert';

function inLogs(logs: any, eventName: string, eventArgs: any = {}): any {
  const event: any = logs.find(
    (e: any) => e.event === eventName && Object.entries(eventArgs).every(([k, v]) => e.args[k] === v),
  );

  assert(!!event, `Expected to find ${eventName} with ${eventArgs} in ${logs}`);
  return event;
}

async function inTransaction(tx: any, eventName: string, eventArgs = {}): Promise<any> {
  const { logs }: any = await tx;
  return inLogs(logs, eventName, eventArgs);
}

export default {
  inLogs,
  inTransaction,
};
