'use strict';

import ControllerFor from '../models/local/ControllerFor';

export default function add({ contractsData, packageFileName = undefined }) {
  if (contractsData.length === 0) throw new Error('At least one contract name must be provided to add.')

  const appController = ControllerFor(packageFileName)
  contractsData.forEach(({ name, alias }) => {
    appController.validateImplementation(name)
    appController.add(alias || name, name)
  })
  appController.writePackage()
}
