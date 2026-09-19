export const getArgumentValues = (value, matcher) => {
    const match = value.match(matcher);
    if (match)
        return match.map(value => value.trim().split(/[ =]/)[1].trim());
    return [];
};
