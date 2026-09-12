import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = new URL('../', import.meta.url)
const directory = mkdtempSync(join(tmpdir(), 'picochroma-types-'))
try {
  // Resolve the public package name like a consumer, without paths aliases.
  const installed = join(directory, 'node_modules', 'picochroma')
  mkdirSync(installed, { recursive: true })
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  for (const file of ['package.json', pkg.main, pkg.types]) {
    copyFileSync(new URL(file, root), join(installed, file))
  }
  copyFileSync(new URL('scripts/fixtures/consumer.ts', root), join(directory, 'consumer.ts'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }))
  for (const [module, moduleResolution] of [['NodeNext', 'NodeNext'], ['ESNext', 'Bundler']]) {
    writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { strict: true, noEmit: true, target: 'ES2022', module, moduleResolution, types: [] },
      files: ['consumer.ts']
    }))
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('node_modules/typescript/bin/tsc', root)),
      '--project', join(directory, 'tsconfig.json')], { stdio: 'inherit' })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`Type checks failed for ${moduleResolution}`)
    console.log(`Type checks passed: ${moduleResolution}`)
  }
} finally {
  rmSync(directory, { recursive: true, force: true })
}
