import { Loggy } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { CheckParams } from './interfaces';

export default function check({
  contractAlias,
  packageFile,
}: CheckParams): void {
  const controller = new LocalController(packageFile);
  const success = contractAlias
    ? controller.validate(contractAlias)
    : controller.validateAll();
  if (success) {
    Loggy.noSpin(__filename, 'check', 'check-script', 'No issues were found');
  }
}
