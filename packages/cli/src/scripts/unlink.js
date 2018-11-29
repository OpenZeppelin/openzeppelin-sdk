'use strict'

import stdout from '../utils/stdout'
import ControllerFor from "../models/local/ControllerFor"

export default async function unlink({ dependenciesNames = [], packageFile = undefined }) {
  if (!dependenciesNames.length) throw Error('At least one dependency name must be provided.')
  const controller = ControllerFor(packageFile)

  controller.unlinkDependencies(dependenciesNames)
  controller.writePackage()
  dependenciesNames.forEach(dependencyName => stdout(dependencyName))
}

