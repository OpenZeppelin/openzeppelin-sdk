import { Logger } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { CheckParams } from './interfaces';

const log: Logger = new Logger('Check');

export default function check({
  contractAlias,
  packageFile,
}: CheckParams): void {
  const controller = new LocalController(packageFile);
  const success = contractAlias
    ? controller.validate(contractAlias)
    : controller.validateAll();
  if (success) log.info('No issues were found');
}
