'use strict'

import stdout from '../utils/stdout'
import ControllerFor from "../models/local/ControllerFor"

export default async function unlink({ libNames = [], dependencies = [], packageFile = undefined }) {
  dependencies = dependencies.length === 0 && libNames.length !== 0 ? libNames : dependencies

  if (!dependencies.length) throw Error('At least one dependency name must be provided.')
  const controller = ControllerFor(packageFile)

  controller.unlinkDependencies(dependencies)
  controller.writePackage()
  dependencies.forEach(dependencyName => stdout(dependencyName))
}

