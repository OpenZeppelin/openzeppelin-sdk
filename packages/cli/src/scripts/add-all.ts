import { Loggy } from 'zos-lib';
import LocalController from '../models/local/LocalController';
import ProjectFile from '../models/files/ProjectFile';

export default function addAll({ projectFile }: { projectFile?: ProjectFile }): void {
  const controller = new LocalController(projectFile);
  controller.addAll();
  Loggy.noSpin(__filename, 'add', 'add-contracts', 'All local contracts have been added to the project.');
  controller.writePackage();
}
