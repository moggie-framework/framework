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

import { HttpClient } from "./http_client.js"

export class FetchHttpClient extends HttpClient {
	async request(method, url, opts) {
		let headers = new Headers(opts.headers ?? {})
		let body = undefined
		if (opts.body) {
			if (opts.body instanceof ArrayBuffer) {
				body = new Blob([opts.body])
				headers.set("Content-Length", String(opts.body.byteLength))
			} else if (typeof opts.body === "string") {
				body = opts.body
			} else {
				body = JSON.stringify(opts.body)
				headers.set("Content-Type", "application/json")
			}
		}

		return fetch({
			url,
			method,
			headers,
			body,
		})
	}
}
