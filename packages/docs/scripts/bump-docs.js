const handleErrorCode = require('./util').handleErrorCode
const path = require('path')
const shell = require('shelljs')
const tmp = require('tmp')

/**
 * Entry point.
 */
function main(argv) {
  if(argv.length !== 3) {
    console.error([
      'Missing zeppelinos repository tag.',
      'Usage: npm run bump-docs -- <tag>',
      'Example: npm run bump-docs -- v1.7.0'
    ].join('\n'))
    process.exit(1)
  }
  const tag = argv[2]
  const version = tag.slice(1)
  const tempDir = tmp.dirSync().name
  try {
    const repoDir = path.resolve(tempDir, 'zos-lib')
    const contractsDir = path.resolve(repoDir, 'contracts')
    const parentDir = path.resolve('..')
    const outputDir = path.resolve('docs')
    const websiteDir = path.resolve(outputDir, 'website')
    const apiDir = path.resolve(websiteDir, 'build', 'api')
    shell.cd(tempDir)
    handleErrorCode(shell.exec('git clone https://github.com/zeppelinos/zos-lib.git'))
    shell.cd('zos-lib')
    handleErrorCode(shell.exec(`git checkout -b ${tag} ${tag}`))
    handleErrorCode(shell.exec(`npx solidity-docgen ${repoDir} ${contractsDir} ${outputDir} --exclude mocks`))
    shell.cd(websiteDir)
    handleErrorCode(shell.exec(`yarn install`))
    handleErrorCode(shell.exec(`npm run version ${version}`))
    handleErrorCode(shell.exec('npm run build'))
  }
  finally {
    shell.rm('-rf', tempDir)
  }
}

if (require.main === module) {
  try {
    main(process.argv)
  }
  catch (err) {
    console.error(err)
    process.exit(1)
  }
}
