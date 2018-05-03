import Stdlib from "./Stdlib";

export default {
  async call(stdlibNameAndVersion) {
    const params = { save: true, cwd: process.cwd() }
    await npm.install([stdlibNameAndVersion], params)
    return new Stdlib(stdlibNameAndVersion)
  },
}
