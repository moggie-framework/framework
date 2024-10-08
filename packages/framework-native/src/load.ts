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

import { proxy } from '@neon-rs/load'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const Native = proxy({
	platforms: {
		'win32-x64-msvc': () => require('@voyage/native-win32-x64-msvc'),
		'darwin-x64': () => require('@voyage/native-darwin-x64'),
		'darwin-arm64': () => require('@voyage/native-darwin-arm64'),
		'linux-x64-gnu': () => require('@voyage/native-linux-x64-gnu'),
		'linux-arm64-gnu': () => require('@voyage/native-linux-arm64-gnu')
	},
	debug: () => require('../index.node')
})