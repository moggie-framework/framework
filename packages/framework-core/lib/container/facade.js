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

import { resolveName } from "@moggie/helpers"
import { container } from "./resolver.js"

/**
 * Root class for container services that allows for statically accessing the registered instance
 * @class Facade
 * @template OutputType The child type that extends this Facade, for correctly type hinting the interface being returned
 */
export class Facade {
	/**
	 * @returns {Promise<OutputType>}
	 */
	static async facade() {
		const name = resolveName(this)
		if (!name) {
			return null
		}
		return container(name)
	}
}
