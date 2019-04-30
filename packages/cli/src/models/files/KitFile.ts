export const MANIFEST_VERSION = '0.1.0';

export default interface KitFile {
  manifestVersion: string;
  message: string;
  files: string[];
  hooks: object;
}
