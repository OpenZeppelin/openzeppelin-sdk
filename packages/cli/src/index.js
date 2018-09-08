// module information
const version = 'v' + require('../package.json').version

// model objects
import { TestApp, LibApp }from './models/TestApp'
import ControllerFor from './models/local/ControllerFor'
import LocalAppController from './models/local/LocalAppController'
import LocalLibController from './models/local/LocalLibController'
import NetworkAppController from './models/network/NetworkAppController'
import NetworkLibController from './models/network/NetworkLibController'

export {
  version,
  TestApp,
  LibApp,
  ControllerFor,
  LocalAppController,
  LocalLibController,
  NetworkAppController,
  NetworkLibController
}
