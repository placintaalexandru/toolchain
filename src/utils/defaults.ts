import { RawInput } from "../types";

/**
 * Creates a `RawInput` type object having all properties set to null (simulates a situation when the user does not set
 * any input in the action).
 *
 * @returns{RawInput} - object having all properties empty.
 */
export const defaultRawInput = (): RawInput => {
    return {
        toolchain: null,
        profile: null,
        components: null,
        targets: null,
        default: null,
        override: null,
        force: null,
    };
};
