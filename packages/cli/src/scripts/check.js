import ControllerFor from '../models/local/ControllerFor';
import { Logger } from 'zos-lib';

const log = new Logger('Check');

export default function check({ contractAlias, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  const success = contractAlias ? controller.validate(contractAlias) : controller.validateAll();
  if (success) log.info('No issues were found');
}
