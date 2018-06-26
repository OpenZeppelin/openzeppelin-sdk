import ControllerFor from "../models/local/ControllerFor";

export default function addAll({ packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  controller.addAll()
  controller.writePackage()
}
