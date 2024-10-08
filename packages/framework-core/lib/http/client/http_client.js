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

export class HttpClient {
	async request(method, url, opts) {
		throw new Error("Not implemented: HttpClient.request()")
	}
	async get(url, opts) {
		return this.request("GET", url, opts)
	}
	async post(url, opts) {
		return this.request("POST", url, opts)
	}
	async put(url, opts) {
		return this.request("PUT", url, opts)
	}
	async delete(url, opts) {
		return this.request("DELETE", url, opts)
	}
	async patch(url, opts) {
		return this.request("PATCH", url, opts)
	}
	async head(url, opts) {
		return this.request("HEAD", url, opts)
	}
	async options(url, opts) {
		return this.request("OPTIONS", url, opts)
	}
	async trace(url, opts) {
		return this.request("TRACE", url, opts)
	}
}
