import { identity } from "../../function/identity.mjs";
import { isArrayLike } from "../predicate/isArrayLike.mjs";
import { iteratee } from "../util/iteratee.mjs";
import { isIterateeCall } from "../_internal/isIterateeCall.mjs";
import "../compat.mjs";
//#region src/compat/array/every.ts
/**
* Checks if every item in an object has a specific property, where the property name is provided as a PropertyKey.
*
* @template T
* @param source - The source array or object to check through.
* @param [doesMatch] - The criteria to match. It can be a function, a partial object, a key-value pair, or a property name.
* @param [guard] - Enables use as an iteratee for methods like `_.map`.
* @returns `true` if every property value has the specified property, or `false` if at least one does not match.
*
* @example
* // Using a property name
* const obj = { a: { id: 1, name: 'Alice' }, b: { id: 2, name: 'Bob' } };
* const result = every(obj, 'name');
* console.log(result); // true
*/
function every(source, doesMatch, guard) {
	if (!source) return true;
	if (guard && isIterateeCall(source, doesMatch, guard)) doesMatch = void 0;
	const predicate = iteratee(doesMatch ?? identity);
	if (!isArrayLike(source)) {
		const keys = Object.keys(source);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const value = source[key];
			if (!predicate(value, key, source)) return false;
		}
		return true;
	}
	for (let i = 0; i < source.length; i++) if (!predicate(source[i], i, source)) return false;
	return true;
}
//#endregion
export { every };
