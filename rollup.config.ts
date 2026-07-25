// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const config = {
    input: 'src/index.ts',
    output: {
        esModule: true,
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    // `json` is required on top of the template's plugins, dependencies of
    // telegraf (e.g. tr46) import JSON files.
    plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs(), json()]
}

export default config
