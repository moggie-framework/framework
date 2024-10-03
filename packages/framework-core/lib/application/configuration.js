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

import pathUtil from "node:path"
import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

const TEST_JS_FILE = /\.js$/i
const TEST_TS_FILE = /\.ts$/i
const TEST_JSON_FILE = /\.json$/i

/**
 * @typedef {"blank" | "json" | "js" | "ts"} FileType
 */

/**
 * @typedef {object} FileInfo
 * @property {string} filename
 * @property {FileType} filetype
 */

/**
 *
 * @param {string} root
 * @param {string[]} files
 * @returns {Promise<Record<string, object>>}
 */
export async function tryLoadConfigFiles(root, files) {
	const config = {}

	for (const file of files) {
		const variants = makeVariants(file)
		for (const variant of variants) {
			const path = pathUtil.resolve(root, variant.filename)
			switch (variant.filetype) {
				case "json": {
					try {
						const content = await readFile(path, "utf8")
						config[file] = JSON.parse(content)
						break
					} catch (error) {
						if (!isMissingFile(error)) {
							throw error
						}
					}
				}
				case "js":
				case "ts":
				case "blank": {
					try {
						const value = await import(pathToFileURL(path))
						config[file] = value.default ?? value
						break
					} catch (error) {
						if (!isMissingFile(error)) {
							throw error
						}
					}
				}
			}
		}
	}

	return config
}

function isMissingFile(error) {
	return error.code === "ENOENT"
}

/**
 * @param {string} name
 * @returns {FileInfo[]}
 */
function makeVariants(name) {
	const output = []
	if (TEST_JS_FILE.test(name)) {
		output.push({ filename: name, filetype: "js" })
		output.push({ filename: name.replace(TEST_JS_FILE, ".ts"), filetype: "ts" })
		output.push({
			filename: name.replace(TEST_JS_FILE, ".json"),
			filetype: "json",
		})
	} else if (TEST_TS_FILE.test(name)) {
		output.push({ filename: name, filetype: "ts" })
		output.push({ filename: name.replace(TEST_TS_FILE, ".js"), filetype: "js" })
		output.push({
			filename: name.replace(TEST_TS_FILE, ".json"),
			filetype: "json",
		})
	} else if (TEST_JSON_FILE.test(name)) {
		output.push({ filename: name, filetype: "json" })
		output.push({
			filename: name.replace(TEST_JSON_FILE, ".js"),
			filetype: "js",
		})
		output.push({
			filename: name.replace(TEST_JSON_FILE, ".ts"),
			filetype: "ts",
		})
	} else {
		output.push({ filename: name, filetype: "blank" })
		output.push({ filename: `${name}.js`, filetype: "js" })
		output.push({ filename: `${name}.ts`, filetype: "ts" })
		output.push({ filename: `${name}.json`, filetype: "json" })
	}
	return output
}
