'use strict'

import tmp from 'tmp'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { exec, cd, cp, rm } from './util'

function main(argv) {
  if(argv.length !== 3) {
    console.error('Missing ZeppelinOS repository tag. Usage: npm run bump-docs -- <tag>')
    process.exit(1)
  }

  const tag = argv[2]
  const version = tag.slice(1)
  const tmpDir = tmp.dirSync().name

  try {
    const localDocsDir = path.resolve(__dirname, '../', 'docs')
    const localBuiltDocsDir = path.resolve(localDocsDir, 'docs')
    const localWebsiteDir = path.resolve(localDocsDir, 'website')
    const localSidebarFile = path.resolve(localWebsiteDir, 'sidebars.json')
    const packagesDir = path.resolve(tmpDir, 'zos', 'packages')
    const builtDocs = path.resolve(packagesDir, 'docs', 'docs', 'docs')

    cd(tmpDir)
    exec('git clone https://github.com/zeppelinos/zos.git')
    cd('zos')
    exec(`git checkout -b ${tag} ${tag}`)
    cleanupSidebar(packagesDir)
    const cliSections = genCliDocs(packagesDir)
    const libSections = genLibDocs(packagesDir)
    const { docs, reference } = JSON.parse(readFileSync(localSidebarFile, 'utf8'))
    const updatedSidebar = { docs, reference: { ...reference, ...cliSections, ...libSections } }

    cp(`${builtDocs}/*.md`, localBuiltDocsDir)
    writeFileSync(localSidebarFile, JSON.stringify(updatedSidebar, null, 2), { encoding:'utf8', flag:'w' })

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

function genLibDocs(packagesDir) {
  const docsDir = path.resolve(packagesDir, 'docs', 'docs')
  const builtDocs = path.resolve(docsDir, 'docs')
  const libDir = path.resolve(packagesDir, 'lib')
  const libContractsDir = path.resolve(libDir, 'contracts')
  const ozDir = path.resolve(libDir, 'node_modules', 'openzeppelin-solidity')
  const sidebar =  path.resolve(docsDir, 'website', 'sidebars.json')

  cd(libDir)
  exec('npm install > "/dev/null" 2>&1')
  exec(`SOLC_ARGS='openzeppelin-solidity=${ozDir}' npx solidity-docgen ${libDir} ${libContractsDir} ${docsDir} --exclude mocks`)
  rm(`${builtDocs}/api_mocks*`)
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

