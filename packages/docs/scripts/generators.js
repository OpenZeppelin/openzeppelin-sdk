'use strict'

import { readFileSync } from 'fs'
import path from 'path'

import { exec, cd, cp, rm } from './util'

export function generateSidebar(docs, cliSections, libSections) {
  return {
    docs,
    reference: {
      WELCOME: [ 'apis' ],
      ...cliSections,
      ...libSections
    }
  }
}

export function cleanupSidebar(packagesDir) {
  const sidebar = path.resolve(packagesDir, 'docs', 'docs', 'website', 'sidebars.json')
  exec(`echo "{}" > ${sidebar}`)
}

export function genCliDocs(packagesDir) {
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

export function genLibDocs(packagesDir) {
  const docsDir = path.resolve(packagesDir, 'docs', 'docs')
  const builtDocs = path.resolve(docsDir, 'docs')
  const libDir = path.resolve(packagesDir, 'lib')
  const libContractsDir = path.resolve(libDir, 'contracts')
  const mocks = path.resolve(libContractsDir, 'mocks')
  const ozDir = path.resolve(libDir, 'node_modules', 'openzeppelin-solidity')
  const mockDependencyDir = path.resolve(libDir, 'node_modules', 'mock-dependency')
  const sidebar = path.resolve(docsDir, 'website', 'sidebars.json')

  cd(libDir)
  console.log('Removing mocks contracts manually...')
  rm(`${mocks}`, '-rf')
  exec('npm install > "/dev/null" 2>&1')
  console.log('Generating lib solidity docs...')
  exec(`SOLC_ARGS='openzeppelin-solidity=${ozDir}' npx solidity-docgen ${libDir} ${libContractsDir} ${docsDir}`)
  rm(`${builtDocs}/api_es_openzeppelin-solidity*`)
  const { 'docs-api': docs } = JSON.parse(readFileSync(sidebar, 'utf8'))

  if (docs.UNCATEGORIZED) {
    docs.INITIALIZE = docs.UNCATEGORIZED
    delete docs.UNCATEGORIZED
  }

  return docs;
}

