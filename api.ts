export type ApiMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type ApiAuth = "portal";

export type ApiDecoratorConfig = {
  path: string;
  methods?: ApiMethod[];
  auth?: ApiAuth | string;
};

export type ApiRequestInit = {
  requestId: string;
  method: ApiMethod | string;
  path: string;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
  contentType?: string | null;
  contentLength?: number;
  bodyText?: string | null;
  bodyBase64?: string | null;
  idRobo: number;
  idMicroapp: number;
  idUsuario?: string | null;
  portal?: Record<string, unknown> | null;
};

export class ApiHeaders {
  private values = new Map<string, string>();

  constructor(headers: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(headers)) {
      this.values.set(key.toLowerCase(), value);
    }
  }

  get(name: string): string | null {
    return this.values.get(name.toLowerCase()) ?? null;
  }

  has(name: string): boolean {
    return this.values.has(name.toLowerCase());
  }

  toJSON(): Record<string, string> {
    return Object.fromEntries(this.values.entries());
  }
}

export class ApiQuery {
  private values: Record<string, string | string[]>;

  constructor(query: Record<string, string | string[]> = {}) {
    this.values = { ...query };
  }

  get(name: string): string | null {
    const value = this.values[name];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }

  getAll(name: string): string[] {
    const value = this.values[name];
    if (Array.isArray(value)) return value;
    return value === undefined ? [] : [value];
  }

  toJSON(): Record<string, string | string[]> {
    return { ...this.values };
  }
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(value: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < value.length; i += chunkSize) {
    binary += String.fromCharCode(...value.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export class ApiRequest {
  requestId: string;
  method: ApiMethod | string;
  path: string;
  query: ApiQuery;
  headers: ApiHeaders;
  contentType: string | null;
  contentLength: number;
  idRobo: number;
  idMicroapp: number;
  idUsuario: string | null;
  portal: Record<string, unknown> | null;
  private bodyTextValue: string | null;
  private bodyBase64Value: string | null;

  constructor(init: ApiRequestInit) {
    this.requestId = init.requestId;
    this.method = init.method.toUpperCase();
    this.path = init.path;
    this.query = new ApiQuery(init.query ?? {});
    this.headers = new ApiHeaders(init.headers ?? {});
    this.contentType = init.contentType ?? null;
    this.contentLength = init.contentLength ?? 0;
    this.idRobo = init.idRobo;
    this.idMicroapp = init.idMicroapp;
    this.idUsuario = init.idUsuario ?? null;
    this.portal = init.portal ?? null;
    this.bodyTextValue = init.bodyText ?? null;
    this.bodyBase64Value = init.bodyBase64 ?? null;
  }

  static from(value: ApiRequest | ApiRequestInit): ApiRequest {
    if (value instanceof ApiRequest) return value;
    return new ApiRequest(value);
  }

  async text(): Promise<string> {
    if (this.bodyTextValue !== null) return this.bodyTextValue;
    if (this.bodyBase64Value === null) return "";
    return new TextDecoder().decode(base64ToBytes(this.bodyBase64Value));
  }

  async json(): Promise<unknown> {
    const body = await this.text();
    if (!body) return null;
    return JSON.parse(body);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.bodyBase64Value !== null) {
      const bytes = base64ToBytes(this.bodyBase64Value);
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      return copy.buffer;
    }
    const bytes = new TextEncoder().encode(this.bodyTextValue ?? "");
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
  }
}

export type ApiResponseInit = {
  status?: number;
  headers?: Record<string, string>;
  contentType?: string;
};

export class ApiResponse {
  __virti_api_response = true;
  type: "response" | "as_user";
  status: number;
  headers: Record<string, string>;
  bodyType: "json" | "text" | "base64" | "empty";
  body: unknown;
  idUsuario?: string;

  private constructor(params: {
    type: "response" | "as_user";
    status?: number;
    headers?: Record<string, string>;
    bodyType?: "json" | "text" | "base64" | "empty";
    body?: unknown;
    idUsuario?: string;
  }) {
    this.type = params.type;
    this.status = params.status ?? 200;
    this.headers = params.headers ?? {};
    this.bodyType = params.bodyType ?? "empty";
    this.body = params.body ?? null;
    this.idUsuario = params.idUsuario;
  }

  static json(body: unknown, init: ApiResponseInit = {}): ApiResponse {
    return new ApiResponse({
      type: "response",
      status: init.status,
      headers: { "content-type": init.contentType ?? "application/json; charset=utf-8", ...(init.headers ?? {}) },
      bodyType: "json",
      body,
    });
  }

  static text(body: string, init: ApiResponseInit = {}): ApiResponse {
    return new ApiResponse({
      type: "response",
      status: init.status,
      headers: { "content-type": init.contentType ?? "text/plain; charset=utf-8", ...(init.headers ?? {}) },
      bodyType: "text",
      body,
    });
  }

  static empty(init: ApiResponseInit = {}): ApiResponse {
    return new ApiResponse({
      type: "response",
      status: init.status ?? 204,
      headers: init.headers,
      bodyType: "empty",
    });
  }

  static binary(body: Uint8Array | ArrayBuffer, init: ApiResponseInit = {}): ApiResponse {
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    return new ApiResponse({
      type: "response",
      status: init.status,
      headers: { "content-type": init.contentType ?? "application/octet-stream", ...(init.headers ?? {}) },
      bodyType: "base64",
      body: bytesToBase64(bytes),
    });
  }

  static asUser(idUsuario: string): ApiResponse {
    return new ApiResponse({
      type: "as_user",
      status: 204,
      bodyType: "empty",
      idUsuario,
    });
  }
}
