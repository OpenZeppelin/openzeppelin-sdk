import { Loggy } from '@openzeppelin/upgrades';

import LocalController from '../models/local/LocalController';
import { AddParams } from './interfaces';

export default function add({ contracts, projectFile }: AddParams): void | never {
  if (contracts.length === 0) throw new Error('At least one contract name must be provided to add.');

  const controller = new LocalController(projectFile);
  contracts.forEach(name => {
    controller.checkCanAdd(name);
    controller.add(name);
  });

  if (contracts.length > 1) {
    Loggy.noSpin(__filename, 'add', 'add-contracts', 'All the selected contracts have been added to the project');
  }
  controller.writePackage();
}
