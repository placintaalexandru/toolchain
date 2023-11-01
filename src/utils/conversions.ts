import { RawInput, ToolchainFile, ToolchainOptions } from "../types";

/**
 * Converts the user input to the actual toolchain options that will be used.
 *
 * @param{RawInput} input - union of what inputs from the GitHub action and the rust-toolchain file.
 * @returns{ToolchainOptions} - final set of options used to install the toolchain.
 */
export const rawInputToToolchainOptions = (
    input: RawInput,
): ToolchainOptions => {
    return {
        toolchain:
            input.toolchain == null || input.toolchain.length == 0
                ? "stable"
                : input.toolchain,
        profile:
            input.profile == null || input.profile.length == 0
                ? "default"
                : input.profile,
        components: input.components == null ? [] : input.components,
        targets: input.targets == null ? [] : input.targets,
        default: input.default || false,
        override: input.override || false,
        noSelfUpdate: false,
        allowDowngrade: false,
        force: input.force || false,
    };
};

/**
 * Transforms the content of a rust toolchain [file](https://rust-lang.github.io/rustup/overrides.html) into a raw input.
 *
 * @param{ToolchainFile} toolchainFile - parsed content of a `rust-toolchain` or `rust-toolchain.toml` file.
 * @returns{RawInput} - RawInput object with options set in the file.
 */
export const toolchainFileToRawInput = (
    toolchainFile: ToolchainFile,
): RawInput => {
    return {
        // https://rust-lang.github.io/rustup/overrides.html#channel
        toolchain: toolchainFile.toolchain?.channel || null,
        profile: toolchainFile.toolchain?.profile || null,
        components: toolchainFile.toolchain?.components || null,
        targets: toolchainFile.toolchain?.targets || null,
        default: null,
        force: null,
        override: null,
    };
};

/**
 * Merges two raw inputs, overriding the base ones with the extra ones.
 *
 * @param{RawInput} base - object whose fields will be overwritten.
 * @param{RawInput} extra - object with replacing values (if not empty).
 * @returns{RawInput} - result of the merge.
 */
export const merge = (base: RawInput, extra: RawInput): RawInput => {
    return {
        toolchain:
            extra.toolchain == null || extra.toolchain.length == 0
                ? base.toolchain
                : extra.toolchain,
        profile:
            extra.profile == null || extra.profile.length == 0
                ? base.profile
                : extra.profile,
        components:
            extra.components == null || extra.components.length == 0
                ? base.components
                : extra.components,
        targets:
            extra.targets == null || extra.targets.length == 0
                ? base.targets
                : extra.targets,
        default: extra.default || base.default,
        override: extra.override || base.default,
        force: extra.force || base.force,
    };
};
