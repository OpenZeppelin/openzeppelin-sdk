import { Loggy } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { CheckParams } from './interfaces';

export default function check({ contractAlias, projectFile }: CheckParams): void {
  const controller = new LocalController(projectFile);
  const success = contractAlias ? controller.validate(contractAlias) : controller.validateAll();
  if (success) {
    Loggy.noSpin(__filename, 'check', 'check-script', 'No issues were found');
  }
}
