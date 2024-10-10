/*
 * Copyright 2024 MicroHacks
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFile } from "node:fs/promises"
import { transform } from "@swc/core"
/** import { LoadHook } from 'node:module' */

const supportedFileGlobs = [".js", ".jsx", ".ts", ".tsx"]

/**
 * @type {LoadHook} load
 */
const load = async function load(url, context, nextLoad) {
	if (url.startsWith("file:") && supportedFileGlobs.some(glob => url.endsWith(glob))) {
		const path = new URL(url)
		let file = (await readFile(path, "utf8")).toString()
		const transformed = await transform(file, {
			filename: path.pathname,
			sourceMaps: "inline",
			swcrc: false,
			isModule: context.format === "module",
			jsc: {
				transform: {
					decoratorVersion: "2022-03",
					useDefineForClassFields: false,
					optimizer: {
						simplify: true,
					},
				},
				target: "es2020",
				parser: {
					syntax: "typescript",
					decorators: true,
				},
			},
		})

		return {
			format: context.format,
			shortCircuit: true,
			source: transformed.code,
		}
	}

	return nextLoad(url, context)
}

export { load }
