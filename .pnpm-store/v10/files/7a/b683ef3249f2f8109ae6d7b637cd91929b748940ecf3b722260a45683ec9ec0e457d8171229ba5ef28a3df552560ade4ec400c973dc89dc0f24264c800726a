//#region src-js/utils/utils.ts
/**
* Get error message from an error.
*
* `err` is expected to be an `Error` object, but can be anything.
*
* * If it's an `Error`, the error message and stack trace is returned.
* * If it's another object with a string `message` property, `message` is returned.
* * Otherwise, a generic "Unknown error" message is returned.
*
* This function will never throw, and always returns a non-empty string, even if:
*
* * `err` is `null` or `undefined`.
* * `err` is an object with a getter for `message` property which throws.
* * `err` has a getter for `stack` or `message` property which returns a different value each time it's accessed.
*
* @param err - Error
* @returns Error message
*/
function getErrorMessage(err) {
	try {
		if (err instanceof Error) {
			let { stack } = err;
			if (typeof stack == "string" && stack !== "") return stack;
		}
		let { message } = err;
		if (typeof message == "string" && message !== "") return message;
	} catch {}
	return "Unknown error";
}
//#endregion
export { getErrorMessage as t };
