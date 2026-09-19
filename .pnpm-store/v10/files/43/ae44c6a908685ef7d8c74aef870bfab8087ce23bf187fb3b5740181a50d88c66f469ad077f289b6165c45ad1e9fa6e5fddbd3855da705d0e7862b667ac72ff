const require_eq = require("../util/eq.js");
//#region src/compat/_internal/assignValue.ts
const assignValue = (object, key, value) => {
	const objValue = object[key];
	if (!(Object.hasOwn(object, key) && require_eq.eq(objValue, value)) || value === void 0 && !(key in object)) object[key] = value;
};
//#endregion
exports.assignValue = assignValue;
