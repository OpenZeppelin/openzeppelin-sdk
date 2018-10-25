'use strict'

import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { exec, cd, cp, rm, mkdir } from './util'

function main(argv) {
  if(argv.length !== 3) {
    console.error('Missing ZeppelinOS repository tag. Usage: npm run bump-docs -- <tag>')
    process.exit(1)
  }

  const tag = argv[2]
  const version = tag.slice(1)
  const tmpDir = path.resolve(__dirname, '../tmp')

  try {
    const localDocsDir = path.resolve(__dirname, '../', 'docs')
    const localBuiltDocsDir = path.resolve(localDocsDir, 'docs')
    const localWebsiteDir = path.resolve(localDocsDir, 'website')
    const localSidebarFile = path.resolve(localWebsiteDir, 'sidebars.json')
    const packagesDir = path.resolve(tmpDir, 'zos', 'packages')
    const builtDocs = path.resolve(packagesDir, 'docs', 'docs', 'docs')

    mkdir(tmpDir)
    cd(tmpDir)
    exec('git clone https://github.com/zeppelinos/zos.git')
    cd('zos')
    exec(`git checkout -b ${tag} ${tag}`)
    cleanupSidebar(packagesDir)
    const cliSections = genCliDocs(packagesDir)
    const libSections = genLibDocs(packagesDir)
    const vouchSections = genVouchDocs(packagesDir)
    const { docs, reference } = JSON.parse(readFileSync(localSidebarFile, 'utf8'))
    const updatedSidebar = { docs, reference: { ...reference, ...cliSections, ...libSections, ...vouchSections } }

    cp(`${builtDocs}/*.md`, localBuiltDocsDir)
    writeFileSync(localSidebarFile, JSON.stringify(updatedSidebar, null, 2), { encoding:'utf8', flag: 'w' })

    cd(localWebsiteDir)
    exec(`npm install`)
    exec(`npm run version ${version}`)
    exec('npm run build')
  } finally {
    rm(tmpDir, '-rf')
  }
}

function cleanupSidebar (packagesDir) {
  const sidebar = path.resolve(packagesDir, 'docs', 'docs', 'website', 'sidebars.json')
  exec(`echo "{}" > ${sidebar}`)
}

function genCliDocs (packagesDir) {
  const cliDir = path.resolve(packagesDir, 'cli')
  const builtDocs = path.resolve(packagesDir, 'docs', 'docs', 'docs')
  const cliBuiltDocs = path.resolve(cliDir, 'docs', 'build')
  const sidebar = path.resolve(cliBuiltDocs, 'sidebars.json')

  cd(cliDir)
  exec('npm install > "/dev/null" 2>&1 && npm run gen-docs')
  cp(`${cliBuiltDocs}/*.md`, builtDocs)
  const { 'cli-api': { commands } } = JSON.parse(readFileSync(sidebar, 'utf8'))

  return { 'CLI REFERENCE': commands }
}

function genVouchDocs(packagesDir) {
  const docsDir = path.resolve(packagesDir, 'docs', 'docs')
  const builtDocs = path.resolve(docsDir, 'docs')
  const vouchDir = path.resolve(packagesDir, 'vouching')
  const vouchContractsDir = path.resolve(vouchDir, 'contracts')
  const libDir = path.resolve(vouchDir, 'node_modules', 'zos-lib')
  const tplDir = path.resolve(vouchDir, 'node_modules', 'tpl-contracts-eth')
  const ozeDir = path.resolve(vouchDir, 'node_modules', 'openzeppelin-eth')
  const sidebar =  path.resolve(docsDir, 'website', 'sidebars.json')

  cd(vouchDir)
  exec('npm install > "/dev/null" 2>&1')
  exec(`SOLC_ARGS='openzeppelin-eth=${ozeDir} zos-lib=${libDir} tpl-contracts-eth=${tplDir}' npx solidity-docgen ${vouchDir} ${vouchContractsDir} ${docsDir} --exclude mocks`)
  rm(`${builtDocs}/api_mocks*`)
  rm(`${builtDocs}/api_es_tpl-contracts-eth*`)
  rm(`${builtDocs}/api_es_openzeppelin-eth*`)
  const { 'docs-api': docs } = JSON.parse(readFileSync(sidebar, 'utf8'))

  return docs;
}

function genLibDocs(packagesDir) {
  const docsDir = path.resolve(packagesDir, 'docs', 'docs')
  const builtDocs = path.resolve(docsDir, 'docs')
  const libDir = path.resolve(packagesDir, 'lib')
  const libContractsDir = path.resolve(libDir, 'contracts')
  const mocks = path.resolve(libContractsDir, 'mocks')
  const ozDir = path.resolve(libDir, 'node_modules', 'openzeppelin-solidity')
  const mockDependencyDir = path.resolve(libDir, 'node_modules', 'mock-dependency')
  const sidebar =  path.resolve(docsDir, 'website', 'sidebars.json')

  cd(libDir)
  console.log('Removing mocks contracts manually...')
  rm(`${mocks}`, '-rf')
  exec('npm install > "/dev/null" 2>&1')
  console.log('Generating lib solidity docs...')
  exec(`SOLC_ARGS='openzeppelin-solidity=${ozDir}' npx solidity-docgen ${libDir} ${libContractsDir} ${docsDir}`)
  rm(`${builtDocs}/api_es_openzeppelin-solidity*`)
  const { 'docs-api': docs } = JSON.parse(readFileSync(sidebar, 'utf8'))

  return docs;
}

if (require.main === module) {
  try {
    main(process.argv)
  }
  catch (error) {
    throw Error(error)
  }
}
