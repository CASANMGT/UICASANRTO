#!/usr/bin/env node
/** Copy CHANGELOG.md, README.md, ROADMAP.md from repo root into web/public/docs/ for in-app display */
import { mkdir, copyFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
const outDir = join(__dirname, '../public/docs')
const docs = ['CHANGELOG.md', 'README.md', 'ROADMAP.md']

await mkdir(outDir, { recursive: true })
for (const f of docs) {
  await copyFile(join(root, f), join(outDir, f))
  console.log(`Copied ${f}`)
}
