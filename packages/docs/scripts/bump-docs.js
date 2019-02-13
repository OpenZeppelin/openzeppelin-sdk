'use strict'

import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import semver from 'semver';

import { genLibDocs, genCliDocs, cleanupSidebar, generateSidebar } from './generators'
import { exec, cd, cp, rm, mkdir } from './util'

function main(argv) {
  if(argv.length !== 3 && argv.length !== 4) {
    console.error('Invalid bump script parameters. Usage: npm run bump-docs <version> or npm run bump-docs <version> <branch>, for example: npm run bump-docs 2.2.0 docs/update_docs or just npm run bump-docs 2.2.0')
    process.exit(1)
  }

  const tmpDir = path.resolve(__dirname, '../tmp')
  const version = argv[2]
  if(!semver.valid(version)) throw new Error(`Invalid version ${version}. Please provide a valid semantic version, e.g., 2.1.2`);
  let branch;
  if (argv[3]) branch = argv[3]

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
    
    branch ? exec(`git checkout ${branch}`) : exec(`git checkout -b v${version} v${version}`)

    cleanupSidebar(packagesDir)
    const cliSections = genCliDocs(packagesDir)
    const libSections = genLibDocs(packagesDir)
    const { docs } = JSON.parse(readFileSync(localSidebarFile, 'utf8'))
    const updatedSidebar = generateSidebar(docs, cliSections, libSections)

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
