'use strict'

import stdout from '../utils/stdout'
import ControllerFor from "../models/local/ControllerFor"

export default async function unlink({ libNames = [], packageFile = undefined }) {
  if (!libNames.length) throw Error('At least one dependency name must be provided.')
  const controller = ControllerFor(packageFile)
  if (controller.isLib) throw Error('Package projects cannot use other packages.')

  controller.unlinkLibs(libNames)
  controller.writePackage()
  libNames.forEach(libName => stdout(libName))
}

