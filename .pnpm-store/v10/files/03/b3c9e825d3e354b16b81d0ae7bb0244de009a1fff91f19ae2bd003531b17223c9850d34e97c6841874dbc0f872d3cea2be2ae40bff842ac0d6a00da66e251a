import { t as tscEmit } from "./tsc-7tKLhbXv.mjs";
import process from "node:process";
//#region src/tsc/worker.ts
process.on("message", (request) => {
	let response;
	try {
		response = {
			id: request.id,
			result: tscEmit(request.options)
		};
	} catch (error) {
		response = {
			id: request.id,
			error
		};
	}
	process.send(response);
});
//#endregion
export {};
