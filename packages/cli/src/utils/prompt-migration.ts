import readline from 'readline';
import { isMigratableZosversion } from '../models/files/ZosVersion';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

export async function hasToMigrateProject(network): Promise<boolean> {
  const zosversion = ZosNetworkFile.getZosversion(network);
  if(isMigratableZosversion(zosversion)) {
    const response = await new Promise((resolve) => {
      const prompt = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      prompt.question(`An old zos version was detected and needs to be migrated to the latest one.\nDo you want to proceed? [y/n] `, (answer) => {
        prompt.close();
        resolve(answer);
      });
    });
    if (!isValidResponse(response)) return hasToMigrateProject(network);
    return response === 'y' || response === 'Y';
  }
  return true;
}

function isValidResponse(response): boolean {
  return response === 'y' || response === 'Y' || response === 'n' || response === 'N';
}
