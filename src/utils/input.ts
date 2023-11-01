export const collect = (value: string, previous: string[]): string[] => {
    if (!previous) {
        return [value];
    }

    return previous.concat([value]);
};
