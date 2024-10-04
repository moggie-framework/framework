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

import type { EventEmitter } from 'node:events'
import {CallableAccessorWithoutNull} from "@voyage/helpers";

export type ApplicationOptions = {
    /**
     * The path, relative to the current working directory, where the application's configuration files are located.
     * If not provided, the default is "config" - the path will be constructed using `path.resolve` from `node:path`
     */
    configRoot?: string
    /**
     * An object to be merged into the resolve application config, accessible from anywhere else in the application.
     * Values set here will take priority over any defaults or values set in config files
     */
    config?: object;
    /**
     * Customise whether certain external resource types are loaded; this behaviour may be undesirable for security reasons
     */
    disable?: {
        /**
         * When true, do not try to load any file based configs
         */
        fs?: boolean,
        /**
         * When true, do not load any ".env" files
         */
        env?: boolean
    }
}

export type ApplicationEventMap = {
    'app:booting': [],
    'app:booted': [],
}

export class Application extends EventEmitter<ApplicationEventMap> {
    config: CallableAccessorWithoutNull

    constructor(opts?: ApplicationOptions)
    register(...plugins: any[]): void;
    boot(): Promise<void>;
}