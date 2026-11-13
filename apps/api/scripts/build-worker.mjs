import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { copyFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
const resolve = createRequire(import.meta.url).resolve
const root = fileURLToPath(new URL('../', import.meta.url))
const stub = `${root}worker-unused-modules.cjs`
await rm(`${root}dist-worker`, { recursive: true, force: true })
await build({
  absWorkingDir: root,
  entryPoints: ['worker.mjs'],
  outfile: 'dist-worker/worker.mjs',
  bundle: true,
  platform: 'node',
  conditions: ['workerd', 'worker'],
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  external: ['cloudflare:*', 'node:*'],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire('/worker.mjs');" },
  plugins: [{ name: 'prisma-worker', setup(build) {
    build.onResolve({ filter: /^@prisma\/client$/ }, () => ({ path: resolve('.prisma/client/wasm') }))
    build.onResolve({ filter: /query_compiler_bg\.wasm$/ }, () => ({ path: './query_compiler_bg.wasm', external: true }))
  } }],
  alias: {
    '@nestjs/websockets/socket-module': stub,
    '@nestjs/microservices/microservices-module': stub,
    '@nestjs/microservices': stub,
  },
})

await copyFile(resolve('.prisma/client/query_compiler_bg.wasm'), `${root}dist-worker/query_compiler_bg.wasm`)
