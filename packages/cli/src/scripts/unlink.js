'use strict'

import stdout from '../utils/stdout'
import ControllerFor from "../models/local/ControllerFor"

export default async function unlink({ libNames = [], packageFile = undefined }) {
  if (!libNames.length) throw Error('At least one library name must be provided.')
  const controller = ControllerFor(packageFile)
  if (controller.isLib) throw Error('Libraries do not use stdlibs.')

  controller.unlinkLibs(libNames)
  controller.writePackage()
  libNames.forEach(libName => stdout(libName))
}

