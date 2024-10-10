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

import { Kernel } from "../../application/kernel.js"
import { container, containerContext } from "../../container/resolver.js"
/** import { ServerResponse, ClientRequest } from 'node:http' */

export class ServerKernel extends Kernel {
	constructor(...args) {
		super(...args)
		this.$server = null
	}

	/**
	 *
	 * @param {ClientRequest} req
	 * @param {ServerResponse} res
	 */
	async handleRequest(req, res) {
		console.log("Found rqeuest")

		const requestContext = container().fork()
		requestContext
			.when("raw-request")
			.value(req)
			.when("raw-response")
			.value(res)
			.when("flash")
			.value(new Map())

		await containerContext.run(requestContext, async () => {
			await this.startAction()

			console.log(req.method, req.url, req.path, req.headers)
			res.writeHead(204, "no content", { "extra-value": 1234 })
			res.end()

			await this.endAction()
		})
	}

	async launch() {
		const config = await container("config")
		const serverConfig = config("http.server", {
			port: 4433,
			address: null,
			tls: null,
		})

		let create = null
		if (serverConfig.tls) {
			const https = await import("node:https")
			create = https.createServer.bind(null, serverConfig.tls)
		} else {
			const http = await import("node:http")
			create = http.createServer
		}

		this.$server = create(this.handleRequest.bind(this))
		this.$server.listen(serverConfig.port ?? 4433)

		const address = this.$server.address()
		console.log("Server listening on http://%s:%d", formatServerAddress(address), address.port)
	}
}

function formatServerAddress(address) {
	if (address.family === "IPv6" && address.address === "::") {
		return "localhost"
	}
	return address.address
}
