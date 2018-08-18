import Dependency from "./Dependency";
import npm from 'npm-programmatic'

const DependencyInstaller = {
  async call(stdlibNameAndVersion) {
    const params = { save: true, cwd: process.cwd() }
    await npm.install([stdlibNameAndVersion], params)
    return new Dependency(stdlibNameAndVersion)
  },
}

export default DependencyInstaller
