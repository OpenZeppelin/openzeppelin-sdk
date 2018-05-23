import ControllerFor from "../models/local/ControllerFor";

export default function addAll({ packageFileName = undefined }) {
  const appController = ControllerFor(packageFileName)
  appController.addAll()
  appController.writePackage()
}
