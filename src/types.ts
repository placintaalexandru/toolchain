/**
 * `RawInput` holds the basic allowed options the user can input to the action.
 */
export interface RawInput {
    toolchain: string | null;
    profile: string | null;
    components: string[] | null;
    targets: string[] | null;
    default: boolean | null;
    override: boolean | null;
    force: boolean | null;
}

/**
 * `ToolchainOptions` holds all the arguments required by the rustup-init script to install a toolchain.
 */
export interface ToolchainOptions {
    // https://rust-lang.github.io/rustup/concepts/toolchains.html
    toolchain: string;
    // https://rust-lang.github.io/rustup/concepts/profiles.html
    // The stable toolchain guarantees most of the components present, so this
    // option is effective when a custom toolchain is used
    profile: string;
    // https://rust-lang.github.io/rustup/concepts/components.html
    components: string[];
    // https://rust-lang.github.io/rustup/concepts/index.html
    targets: string[];
    default: boolean;
    override: boolean;
    noSelfUpdate: boolean;
    allowDowngrade: boolean;
    force: boolean;
}

/**
 * `ToolchainFile` holds the data found in a
 * [toolchain file](https://rust-lang.github.io/rustup/overrides.html#the-toolchain-file).
 */
export interface ToolchainFile {
    // The toolchain file also holds a path option that, when enabled, nullifies
    // the profile, components, targets.
    // At the moment, `path` is not supported by this action.
    toolchain: {
        channel: string | null;
        profile: string | null;
        components: string[] | null;
        targets: string[] | null;
    } | null;
}

/**
 * `Output` the output of the action (the name and the value of the output).
 */
export interface Output {
    name: string;
    value: string;
}
