import { Loggy } from '@openzeppelin/upgrades';

export function describeEvents(events: any): void {
  let description = '';
  Object.values(events)
    .filter(({ event }) => event)
    .forEach(({ event, returnValues }) => {
      const emitted = Object.keys(returnValues)
        .filter(key => !isNaN(Number(key)))
        .map(key => returnValues[key]);

      if (emitted.length !== 0) description = description.concat(`\n - ${event}(${emitted.join(', ')})`);
    });

  if (description) {
    Loggy.noSpin(__filename, 'describe', 'describe-events', `Events emitted: ${description}`);
  }
}
