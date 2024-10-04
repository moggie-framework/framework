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

import {Container} from "../container/resolver";

export abstract class Plugin {
    configPaths(): string[]
    configDefaults(): Record<string, any>

    boot(container: Container): Promise<void>
    preLaunch(container: Container): Promise<void>
    postLaunch(container: Container): Promise<void>
    preAction(container: Container): Promise<void>
    postAction(container: Container): Promise<void>
}

type SingleMethodPluginCallback = (container: Container) => Promise<void> | void
type SingleMethodPluginFactory = (callback: SingleMethodPluginCallback) => Plugin

export declare const onBoot: SingleMethodPluginFactory
export declare const preLaunch: SingleMethodPluginFactory
export declare const postLaunch: SingleMethodPluginFactory
export declare const preAction: SingleMethodPluginFactory
export declare const postAction: SingleMethodPluginFactory

export declare function registerConfig(name: string, value: Record<any, any>): Plugin