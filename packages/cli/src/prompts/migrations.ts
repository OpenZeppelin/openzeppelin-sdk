import readline from 'readline';
import { isMigratableManifestVersion } from '../models/files/ManifestVersion';
import NetworkFile from '../models/files/NetworkFile';

export async function hasToMigrateProject(network): Promise<boolean> {
  const version = NetworkFile.getManifestVersion(network);
  if (isMigratableManifestVersion(version)) {
    const response = await new Promise(resolve => {
      const prompt = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      prompt.question(
        `An old zos version was detected and needs to be migrated to the latest one.\nDo you want to proceed? [y/n] `,
        answer => {
          prompt.close();
          resolve(answer);
        },
      );
    });
    if (!isValidResponse(response)) return hasToMigrateProject(network);
    return response === 'y' || response === 'Y';
  }
  return true;
}

function isValidResponse(response): boolean {
  return response === 'y' || response === 'Y' || response === 'n' || response === 'N';
}
