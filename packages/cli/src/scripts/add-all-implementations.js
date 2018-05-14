import AppController from "../models/AppController";

export default function addAllImplementation({ packageFileName = undefined }) {
  const appController = new AppController(packageFileName)
  appController.addAllImplementations()
  appController.writePackage()
}
