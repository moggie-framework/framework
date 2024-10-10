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

import { bind, createCallable, depends, setClassName } from "@moggie/helpers"

export class RequestHandler {
	constructor() {
		return createCallable(this)
	}
	__call(next) {
		if (this.handle) {
			return Promise.resolve(this.handle(next))
		}
	}
}

export function handler(deps = [], cb) {
	@depends(deps)
	class AnonymousHandler extends RequestHandler {
		constructor(...args) {
			super()
			this.deps = args ?? []
			this.handle = cb
		}

		@bind
		__call(next) {
			return Promise.resolve(this.handle.apply(this, this.deps.concat([next])))
		}
	}
	setClassName(AnonymousHandler, `RequestHandler<${cb.name || "anonymous"}>`)
	return AnonymousHandler
}

/**
 * Adapters for other web frameworks like Connect, adapting their middleware to work with Moggie.
 *
 * @property {(Function) => RequestHandler} connect
 */
export const adapt = {
	/**
	 * Adapt a Connect middleware to a Moggie RequestHandler. There is no specific guarantee that all Connect middleware
	 * will work with Moggie, depending on how it adapts the built-in request/response objects.
	 *
	 * @param {Function} cb
	 * @returns {RequestHandler}
	 */
	connect(cb) {
		return handler(["raw-request", "raw-response"], cb)
	},
}
