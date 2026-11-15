import { createHash } from "node:crypto";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const USER_AGENT = "aislop-installer";
const DOWNLOAD_ATTEMPTS = 3;
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadError = (message, retryable) =>
	Object.assign(new Error(message), { retryable });

export const downloadFile = async (url, destination) => {
	let lastError = null;
	for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
		try {
			const response = await fetch(url, {
				headers: { "User-Agent": USER_AGENT },
			});
			if (response.ok && response.body) {
				await pipeline(
					Readable.fromWeb(response.body),
					fs.createWriteStream(destination),
				);
				return;
			}
			const message = `Failed to download ${url} (${response.status})`;
			lastError = downloadError(message, RETRYABLE_HTTP_STATUSES.has(response.status));
			if (!lastError.retryable) throw lastError;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (lastError.retryable === false || attempt === DOWNLOAD_ATTEMPTS) break;
		}
		await sleep(400 * attempt);
	}
	throw lastError ?? new Error(`Failed to download ${url}`);
};

export const digestOf = async (filePath, algorithm, encoding) => {
	const hash = createHash(algorithm);
	for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
	return hash.digest(encoding);
};

