import { Logger } from 'zos-lib';

import ControllerFor from '../models/local/ControllerFor';
import { CheckParams } from './interfaces';

const log: Logger = new Logger('Check');

export default function check({ contractAlias, packageFile }: CheckParams): void {
  const controller = ControllerFor(packageFile);
  const success = contractAlias ? controller.validate(contractAlias) : controller.validateAll();
  if (success) log.info('No issues were found');
}
