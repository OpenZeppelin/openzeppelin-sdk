function inLogs (logs, eventName, eventArgs = {}) {
  const event = logs.find(e =>
    e.event === eventName &&
    Object.entries(eventArgs).every(([k, v]) => e.args[k] === v))

  assert(!!event, `Expected to find ${eventName} with ${eventArgs} in ${logs}`)
  return event
}

async function inTransaction (tx, eventName, eventArgs = {}) {
  const { logs } = await tx;
  return inLogs(logs, eventName, eventArgs);
}

export default {
  inLogs,
  inTransaction,
}
