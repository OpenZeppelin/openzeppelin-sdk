const handleErrorCode = require('./util').handleErrorCode
const path = require('path')
const shell = require('shelljs')
const tmp = require('tmp')

/**
 * Entry point.
 */
function main(argv) {
  try {
    shell.mkdir('-p', 'docs')
    shell.pushd('-q', 'docs')
    handleErrorCode(shell.exec('npm init -y'))
    handleErrorCode(shell.exec('npm install docusaurus-init'))
    handleErrorCode(shell.exec('docusaurus-init'))
    shell.mv('docs-examples-from-docusaurus/', 'docs')
    shell.mv('website/blog-examples-from-docusaurus/', 'website/blog')
    shell.pushd('-q', 'website')
    handleErrorCode(shell.exec('npm run examples versions'))
    shell.popd('-q')
    shell.popd('-q')
  }
  catch (err) {
    shell.rm('-rf', 'docs')
    throw err
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
