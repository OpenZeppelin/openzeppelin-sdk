import ControllerFor from "../models/local/ControllerFor";

export default function addAllImplementations({ packageFileName = undefined }) {
  const appController = ControllerFor(packageFileName)
  appController.addAllImplementations()
  appController.writePackage()
}
