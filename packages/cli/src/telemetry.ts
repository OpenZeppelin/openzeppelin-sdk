import envPaths from 'env-paths';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import ProjectFile from './models/files/ProjectFile';

import ConfigManager from './models/config/ConfigManager';

interface GlobalTelemetry {
  optIn: boolean;
  uuid: unknown;
  salt: unknown;
}

//TODO: rename
export async function telemetry(commandName, options) {
  if (!(await checkOptIn())) return;
  const { networkName } = options;
  const {
    network: { networkId },
  } = ConfigManager.config.loadNetworkConfig(networkName);

  // TODO: send data to the server
}

async function checkOptIn(): Promise<boolean> {
  const project = new ProjectFile();
  const localOptIn = project.telemetryOptIn;

  const { data: globalDataDir } = envPaths('openzeppelin-sdk');
  const globalDataPath = path.join(globalDataDir, 'telemetry.json');
  let globalOptIn: GlobalTelemetry | undefined = await fs.readJson(globalDataPath).catch(() => undefined);

  if (localOptIn === false) return false;

  if (globalOptIn === undefined) {
    const { telemetry } = await inquirer.prompt({
      name: 'telemetry',
      type: 'confirm',
      message: 'telemetry?',
      default: true,
    });

    globalOptIn = { optIn: telemetry, uuid: 1, salt: 0 };
    await fs.writeJson(globalDataPath, globalOptIn);
  }

  if (localOptIn === undefined) {
    project.telemetryOptIn = globalOptIn.optIn;
    // Note: following function is sync
    project.write();
  }

  return globalOptIn.optIn;
}
