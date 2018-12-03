'use strict'

import stdout from '../utils/stdout'
import ControllerFor from "../models/local/ControllerFor"

export default async function unlink({ libNames = [], dependenciesNames = [], packageFile = undefined }) {
  dependenciesNames = dependenciesNames.length === 0 && libNames.length !== 0 ? libNames : dependenciesNames
  installDependencies = !installDependencies && installLibs ? installLibs : installDependencies

  if (!dependenciesNames.length) throw Error('At least one dependency name must be provided.')
  const controller = ControllerFor(packageFile)

  controller.unlinkDependencies(dependenciesNames)
  controller.writePackage()
  dependenciesNames.forEach(dependencyName => stdout(dependencyName))
}

