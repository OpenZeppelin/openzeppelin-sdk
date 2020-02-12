import { Loggy } from '@openzeppelin/upgrades';

import LocalController from '../models/local/LocalController';
import { CheckParams } from './interfaces';

export default function check({ contractName, projectFile }: CheckParams): void {
  const controller = new LocalController(projectFile);
  const success = contractName ? controller.validate(contractName) : controller.validateAll();
  if (success) {
    Loggy.noSpin(__filename, 'check', 'check-script', 'No issues were found');
  }
}
