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

/**
 * The type of config file being loaded. "blank" represents any file that does not match a known extension, and will
 * be treated as "importable" with the assumption that an appropriate file loader has been registered.
 */
export type FileType = "js" | "ts" | "json" | "blank"

/**
 * Inferred information about a file being loaded.
 */
export type FileInfo = {
	filetype: FileType
	filename: string
}

export function tryLoadConfigFiles(root: string, files: string[]): Promise<Record<string, any>>
