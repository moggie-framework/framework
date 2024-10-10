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

export type SupportedMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "HEAD"
	| "OPTIONS"
	| "TRACE"

export type HttpRequestOpts = {
	body?: null | string | ArrayBuffer | object
	headers?: Record<string, string> | Headers
}

export abstract class HttpClient {
	request(method: SupportedMethod, url: string, opts: HttpRequestOpts): Promise<Response>
	get(url: string, opts: HttpRequestOpts): Promise<Response>
	post(url: string, opts: HttpRequestOpts): Promise<Response>
	put(url: string, opts: HttpRequestOpts): Promise<Response>
	delete(url: string, opts: HttpRequestOpts): Promise<Response>
	patch(url: string, opts: HttpRequestOpts): Promise<Response>
	head(url: string, opts: HttpRequestOpts): Promise<Response>
	options(url: string, opts: HttpRequestOpts): Promise<Response>
	trace(url: string, opts: HttpRequestOpts): Promise<Response>
}
