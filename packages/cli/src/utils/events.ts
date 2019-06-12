import { Loggy } from 'zos-lib';

export function describeEvents(events: any): void {
  let description = '';
  Object.values(events).forEach(({ event, returnValues }) => {
    const emitted = Object.keys(returnValues)
      .filter(key => isNaN(Number(key)))
      .map(key => `${key}: ${returnValues[key]}`);

    description = description.concat(`\n - ${event}(${emitted.join(', ')})`);
  });

  Loggy.noSpin(
    __filename,
    'describe',
    'describe-events',
    `Events emitted: ${description}`,
  );
}
