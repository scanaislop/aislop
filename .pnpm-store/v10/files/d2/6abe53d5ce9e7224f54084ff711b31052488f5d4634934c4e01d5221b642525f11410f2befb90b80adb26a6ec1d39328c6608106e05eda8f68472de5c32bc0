export const getValuesByKeyDeep = (obj, key) => {
    const objects = [];
    if (obj && typeof obj === 'object') {
        for (const i in obj) {
            if (obj[i] && typeof obj[i] === 'object') {
                const values = getValuesByKeyDeep(obj[i], key);
                objects.push(...values);
            }
            else if (i === key) {
                objects.push(obj[i]);
            }
        }
    }
    return objects;
};
export const findByKeyDeep = (obj, key) => {
    const objects = [];
    if (obj && typeof obj === 'object') {
        if (key in obj) {
            objects.push(obj);
        }
        for (const value of Object.values(obj)) {
            if (Array.isArray(value)) {
                for (const item of value) {
                    objects.push(...findByKeyDeep(item, key));
                }
            }
            else if (typeof value === 'object') {
                objects.push(...findByKeyDeep(value, key));
            }
        }
    }
    return objects;
};
export const getKeysByValue = (obj, value) => {
    const keys = [];
    for (const key in obj) {
        if (obj[key] === value)
            keys.push(key);
    }
    return keys;
};
export const get = (obj, path) => path.split('.').reduce((o, p) => o?.[p], obj);
