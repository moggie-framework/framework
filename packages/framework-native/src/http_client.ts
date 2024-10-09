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

import { Native } from "./load.js"
import type { InnerHttpClientToken } from "./load.js"
import { HttpClient, HttpRequestOpts } from "@voyage/core/http"
import type { SupportedMethod } from "@voyage/core/http"

const { HttpClientRequest, HttpClientCreate } = Native

declare module "./load.js" {
	export const InnerHttpClient: unique symbol
	export type InnerHttpClientToken = typeof InnerHttpClient

	function HttpClientCreate(): InnerHttpClientToken
	function HttpClientRequest(
		client: InnerHttpClientToken,
		method: SupportedMethod,
		url: string,
		headers: object,
		body: any,
		cb: Function,
	): void

	type NativeExport = {
		HttpClientCreate: typeof HttpClientCreate
		HttpClientRequest: typeof HttpClientRequest
	}
}

const INNER_CLIENT = Symbol("Inner Client")

/**
 * Native code implementation of HttpClient
 */
export class NativeHttpClient extends HttpClient {
	/**
	 * Reference to the Rust struct in V8 memory
	 *
	 * @private
	 */
	private [INNER_CLIENT]: InnerHttpClientToken

	constructor() {
		super()
		this[INNER_CLIENT] = HttpClientCreate()
	}

	async request(
		method: SupportedMethod,
		url: string,
		opts: HttpRequestOpts = {},
	): Promise<Response> {
		const headers = new Headers(opts.headers ?? {})
		let body = opts.body ?? null

		if (opts.body instanceof ArrayBuffer) {
			body = new Uint8Array(opts.body)
		} else if (typeof opts.body !== "string") {
			body = JSON.stringify(opts.body)
			headers.set("content-type", "application/json")
		}

		return await new Promise((resolve, reject) => {
			console.log("Calling Rust code...", method, url, headers, body)
			try {
				HttpClientRequest(
					this[INNER_CLIENT],
					method,
					url,
					headers,
					body,
					(err: Error | string | null, result: any) => {
						if (err) {
							if (typeof err === "string") {
								reject(new Error(err))
							} else {
								reject(err)
							}
						} else {
							let res_status =
								typeof result.status === "number"
									? result.status
									: parseInt(result.status, 10)

							let res_body = null
							if (res_status !== 204 && res_status !== 304) {
								res_body = result.body
							}

							resolve(
								new Response(res_body, {
									status: res_status,
									headers: result.headers,
								}),
							)
						}
					},
				)
			} catch (e) {
				reject(e)
			}
		})
	}
}
