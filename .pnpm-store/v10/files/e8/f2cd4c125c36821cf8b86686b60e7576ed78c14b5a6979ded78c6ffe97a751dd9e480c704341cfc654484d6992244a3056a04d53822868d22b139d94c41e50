import { eq } from "../util/eq.mjs";
//#region src/compat/_internal/assignValue.ts
const assignValue = (object, key, value) => {
	const objValue = object[key];
	if (!(Object.hasOwn(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) object[key] = value;
};
//#endregion
export { assignValue };
