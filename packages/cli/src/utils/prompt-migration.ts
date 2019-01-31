import readline from 'readline';
import { isNotMigratableZosversion } from '../models/files/ZosVersion';

export async function willMigrateProjectIfNeeded(zosversion): Promise<boolean> {
  if(!isNotMigratableZosversion(zosversion)) {
    const response = await new Promise((resolve) => {
      const prompt = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      prompt.question(`An old version of the ZeppelinOS project was detected and needs to be migrated to the latest one.\nDo you want to proceed? [y/n] `, (answer) => {
        prompt.close();
        resolve(answer);
      });
    });
    if (!isValidResponse(response)) return willMigrateProjectIfNeeded(zosversion);
    return response === 'y' || response === 'Y';
  }
  return true;
}

function isValidResponse(response): boolean {
  return response == 'y' || response == 'Y' || response == 'n' || response == 'N';
}
