// HTTP request operation handler

import fetch from "node-fetch";
import { HttpRequestConfig } from "../../../types/command-spec";

export async function executeHttpRequest(config: HttpRequestConfig): Promise<unknown> {
  // Validate URL protocol to prevent SSRF
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.url);
  } catch (err) {
    throw new Error(`Invalid URL: ${config.url}`);
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed.`);
  }
  // Set up timeout using AbortController
  const controller = new AbortController();
  const timeoutMs = typeof config.timeout === "number" ? config.timeout : 30000; // default 30s
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`HTTP request timed out after ${timeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
