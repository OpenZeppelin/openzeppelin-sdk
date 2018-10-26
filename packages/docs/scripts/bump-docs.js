'use strict'

import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { genLibDocs, genVouchDocs, genCliDocs, cleanupSidebar, generateSidebar } from './generators'
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
    const { docs } = JSON.parse(readFileSync(localSidebarFile, 'utf8'))
    const updatedSidebar = generateSidebar(docs, cliSections, libSections, vouchSections)

    cp(`${builtDocs}/*.md`, localBuiltDocsDir)
    writeFileSync(localSidebarFile, JSON.stringify(updatedSidebar, null, 2), { encoding:'utf8', flag: 'w' })

    cd(localWebsiteDir)
    exec('npm install > "/dev/null" 2>&1')
    exec(`npm run version ${version}`)
    exec('npm run build')
  } finally {
    rm(tmpDir, '-rf')
  }
}

if (require.main === module) {
  try {
    main(process.argv)
  }
  catch (error) {
    throw Error(error)
  }
}
