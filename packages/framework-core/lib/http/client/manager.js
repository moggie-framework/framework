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

import { Manager } from "../../manager/manager.js"
import { depends } from "@voyage/helpers"
import { FetchHttpClient } from "./fetch_client.js"

@depends("config")
export class HttpClientManager extends Manager {
	constructor(config) {
		super()
		this.$config = config
		this.manageClass("fetch", FetchHttpClient)
	}

	config() {
		return this.$config("http.client") ?? { driver: "fetch" }
	}
}
