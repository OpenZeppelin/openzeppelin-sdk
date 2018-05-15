import Stdlib from "./Stdlib";
import npm from 'npm-programmatic'

const StdlibInstaller = {
  async call(stdlibNameAndVersion) {
    const params = { save: true, cwd: process.cwd() }
    await npm.install([stdlibNameAndVersion], params)
    return new Stdlib(stdlibNameAndVersion)
  },
}

export default StdlibInstaller
