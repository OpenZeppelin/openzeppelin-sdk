import path from 'path';
import { Loggy, SpinnerAction } from 'zos-lib';

const fileName = path.basename(__filename);

export function describeEvents(events: any): void {
  let description = '';
  Object.values(events).forEach(({ event, returnValues }) => {
    const emitted = Object.keys(returnValues)
      .filter(key => isNaN(Number(key)))
      .map(key => `${key}: ${returnValues[key]}`);

    description = description.concat(`\n - ${event}(${emitted.join(', ')})`);
  });

  Loggy.add(
    `${fileName}#describe`,
    'describe-events',
    `Events emitted: ${description}`,
    { spinnerAction: SpinnerAction.NonSpinnable },
  );
}
