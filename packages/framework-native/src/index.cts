import { HttpClientCreate, HttpClientRequest } from './load.cjs';
import type { InnerHttpClientToken } from './load.cjs';

declare module "./load.cjs" {
  export const InnerHttpClient: unique symbol;
  export type InnerHttpClientToken = typeof InnerHttpClient;

  export function HttpClientCreate(): InnerHttpClientToken;
  export function HttpClientRequest(client: InnerHttpClientToken, method: SupportedMethod, url: string, headers: object, body: any, cb: Function): void;
}

const INNER_CLIENT = Symbol("Inner Client")

export type SupportedMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE';

/**
 * Native code implementation of HttpClient
 */
export class NativeHttpClient {
  /**
   * Reference to the Rust struct in V8 memory
   *
   * @private
   */
  private [INNER_CLIENT]: InnerHttpClientToken;

  constructor() {
    this[INNER_CLIENT] = HttpClientCreate();
  }

  async request(method: SupportedMethod, url: string, headers: object, body: any) {
    return await new Promise((resolve, reject) => {
      try {
        HttpClientRequest(this[INNER_CLIENT], method, url, headers, body, (err: Error | string | null, result: any) => {
          if (err) {
            if (typeof err === 'string') {
              reject(new Error(err));
            } else {
              reject(err);
            }
          } else {
            resolve(new Response(result.body, {
              // @ts-ignore
              url,
              status: result.status,
              headers: result.headers,
            }));
          }
        });
      } catch(e) {
        reject(e);
      }
    })
  }

  async get(url: string, headers: object, body: any) {
    return this.request('GET', url, headers, body);
  }
  async post(url: string, headers: object, body: any) {
    return this.request('POST', url, headers, body);
  }
  async put(url: string, headers: object, body: any) {
    return this.request('PUT', url, headers, body);
  }
  async delete(url: string, headers: object, body: any) {
    return this.request('DELETE', url, headers, body);
  }
  async patch(url: string, headers: object, body: any) {
    return this.request('PATCH', url, headers, body);
  }
  async head(url: string, headers: object, body: any) {
    return this.request('HEAD', url, headers, body);
  }
  async options(url: string, headers: object, body: any) {
    return this.request('OPTIONS', url, headers, body);
  }
}
