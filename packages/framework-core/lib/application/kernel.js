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

/** import { Application } from './application.js'; */

/**
 * @class Kernel
 * @property {Application} $application - The application instance for this kernel
 */
export class Kernel {
	constructor(application) {
		this.$application = application
	}

	async $boot() {
		await this.$application.launching()
		await this.launch()
		await this.$application.launched()
	}
	async startAction() {
		await this.$application.processing()
	}
	async endAction() {
		await this.$application.processed()
	}

	/**
	 * Launch the kernel - this method should initiate any external resources that the kernel needs to manage
	 * @abstract
	 * @returns {Promise<void>}
	 */
	async launch() {}
}
