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

export { Container, containerContext, container } from "../lib/container/resolver.js"
export { ConstructionMethod } from "../lib/container/dependency.js"
export { Facade } from "../lib/container/facade.js"
export { Application } from "../lib/application/application.js"
export {
	Plugin,
	registerConfig,
	preLaunch,
	preAction,
	postLaunch,
	postAction,
	onBoot,
} from "../lib/application/plugin.js"
export { Manager } from "../lib/manager/manager.js"
