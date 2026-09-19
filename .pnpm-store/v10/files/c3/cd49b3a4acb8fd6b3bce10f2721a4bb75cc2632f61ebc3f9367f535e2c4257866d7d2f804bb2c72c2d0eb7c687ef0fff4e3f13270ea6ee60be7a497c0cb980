import { intersectionBy as intersectionBy$1 } from "../../array/intersectionBy.mjs";
import { last } from "../../array/last.mjs";
import { uniq } from "../../array/uniq.mjs";
import { uniqBy } from "../../array/uniqBy.mjs";
import { identity } from "../../function/identity.mjs";
import { toArray } from "../_internal/toArray.mjs";
import { property } from "../object/property.mjs";
import { isArrayLikeObject } from "../predicate/isArrayLikeObject.mjs";
//#region src/compat/array/intersectionBy.ts
/**
* Returns the intersection of multiple arrays after applying the iteratee function to their elements.
*
* This function takes multiple arrays and an optional iteratee function (or property key)
* to compare the elements after transforming them. It returns a new array containing the elements from
* the first array that are present in all subsequent arrays after applying the iteratee to each element.
* If no iteratee is provided, the identity function is used.
*
* If the first array is `null` or `undefined`, an empty array is returned.
*
* @template T
* @param array - The first array to compare.
* @param values - The arrays to compare, or the iteratee function.
* @returns A new array containing the elements from the first array that are present
*  in all subsequent arrays after applying the iteratee.
*
* @example
* const array1 = [{ x: 1 }, { x: 2 }, { x: 3 }];
* const array2 = [{ x: 2 }, { x: 3 }];
* const result = intersectionBy(array1, array2, 'x');
* // result will be [{ x: 2 }, { x: 3 }] since these elements have the same `x` property.
*
* @example
* const array1 = [1.1, 2.2, 3.3];
* const array2 = [2.3, 3.3];
* const result = intersectionBy(array1, array2, Math.floor);
* // result will be [2.3, 3.3] since it shares the same integer part when `Math.floor` is applied.
*/
function intersectionBy(array, ...values) {
	if (!isArrayLikeObject(array)) return [];
	const lastValue = last(values);
	const count = isArrayLikeObject(lastValue) ? values.length : values.length - 1;
	const iteratee = getIteratee(lastValue);
	if (count <= 0) return uniqBy(toArray(array), iteratee ?? identity);
	let result = uniq(toArray(array));
	for (let i = 0; i < count; ++i) {
		const value = values[i];
		if (!isArrayLikeObject(value)) return [];
		if (iteratee) result = intersectionBy$1(result, toArray(value), iteratee);
	}
	return result;
}
function getIteratee(value) {
	if (isArrayLikeObject(value)) return identity;
	if (typeof value === "function") return (item) => value(item);
	if (typeof value === "string") return property(value);
	return null;
}
//#endregion
export { intersectionBy };
