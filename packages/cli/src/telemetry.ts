import ConfigManager from './models/config/ConfigManager';

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
  return true;
}
