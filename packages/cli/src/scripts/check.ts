import path from 'path';
import { Logger, Loggy, SpinnerAction } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { CheckParams } from './interfaces';

const fileName = path.basename(__filename);

export default function check({
  contractAlias,
  packageFile,
}: CheckParams): void {
  const controller = new LocalController(packageFile);
  const success = contractAlias
    ? controller.validate(contractAlias)
    : controller.validateAll();
  if (success) {
    Loggy.add(`${fileName}#check`, 'check-script', 'No issues were found', {
      spinnerAction: SpinnerAction.NonSpinnable,
    });
  }
}
