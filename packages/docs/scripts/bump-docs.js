const handleErrorCode = require('./util').handleErrorCode
const path = require('path')
const shell = require('shelljs')
const tmp = require('tmp')
// const fs = require('fs');

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
  const tempDirObj = tmp.dirSync({dir: './'})
  const tempDir = tempDirObj.name
   
  try {
    const parentDir = path.resolve('..')
    const outputDir = path.resolve('docs')
    const websiteDir = path.resolve(outputDir, 'website')
    const apiDir = path.resolve(websiteDir, 'build', 'api')
    
    //kernel
    // const kernelRepoDir = path.resolve(tempDir, 'kernel')
    // const kernelContractsDir = path.resolve(kernelRepoDir, 'contracts')
    // shell.cd(tempDir)
    // handleErrorCode(shell.exec('git clone https://github.com/zeppelinos/kernel.git'))
    // shell.cd('kernel')
    // //handleErrorCode(shell.exec(`git checkout -b ${tag} ${tag}`))
    // handleErrorCode(shell.exec(`npx solidity-docgen ${kernelRepoDir} ${kernelContractsDir} ${outputDir}`))
    
    shell.cd(tempDir)
    const libImportsDir = path.resolve('.', 'openzeppelin-solidity')
    handleErrorCode(shell.exec('git clone https://github.com/openzeppelin/openzeppelin-solidity.git'))
    shell.cd('openzeppelin-solidity')
    handleErrorCode(shell.exec(`git checkout -b v1.8.0 v1.8.0`))
    shell.cd('..')


    //zos-lib
    const libRepoDir = path.resolve('.', 'zos-lib')
    const libContractsDir = path.resolve(libRepoDir, 'contracts')
    //handleErrorCode(shell.exec('git clone https://github.com/zeppelinos/zos-lib.git'))
    shell.cd('zos-lib')
    //handleErrorCode(shell.exec(`git checkout -b ${tag} ${tag}`))
    shell.cd('..')
    // handleErrorCode(shell.exec(`npx solidity-docgen ${libRepoDir} ${libContractsDir} ${outputDir}`))
    //handleErrorCode(shell.exec(`SOLC_ARGS=\'zeppelin-solidity=${libImportsDir}\' npx solidity-docgen ${libRepoDir} ${libContractsDir} ${outputDir}`))
    

    //zos-cli
    const cliRepoDir = path.resolve('.', 'zos-cli')
    const cliContractsDir = path.resolve(cliRepoDir, 'contracts')
    // const cliImportsDir = path.resolve(libRepoDir, 'node_modules/zeppelin-solidity')
    // handleErrorCode(shell.exec('git clone https://github.com/zeppelinos/zos-cli.git'))
    // shell.cd('zos-cli')
    // // handleErrorCode(shell.exec(`git checkout -b ${tag} ${tag}`))
    // handleErrorCode(shell.exec(`npx solidity-docgen ${cliRepoDir} ${cliContractsDir} ${outputDir}`))
    
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
