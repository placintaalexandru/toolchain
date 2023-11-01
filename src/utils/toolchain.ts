import { RawInput, ToolchainFile } from "../types";
import path from "path";
import * as fs from "fs";
import * as toml from "toml";
import * as conversions from "./conversions";
import * as defaults from "./defaults";

/**
 * Looks in the current project's directory and searches for a rust toolchain file, either named `rust-toolchain.toml`
 * or `rust-toolchain`, in the previous order.
 *
 * If both files exist, the content of `rust-toolchain.toml` will be returned as it is looked into first.
 *
 * @returns{string | null} - absolute path to the toolchain file.
 */
export const rustToolchainFile = (): string | null => {
    const workingDir = process.cwd();
    const paths = [
        path.join(workingDir, "rust-toolchain.toml"),
        path.join(workingDir, "rust-toolchain"),
    ];

    for (const rustToolchainFilePath of paths) {
        if (fs.existsSync(rustToolchainFilePath)) {
            return rustToolchainFilePath;
        }
    }

    return null;
};

/**
 * Parses the content of a toolchain file and returns an object with the properties set in the file.
 *
 * @param{string} toolchainFilePath - absolute path to the toolchain file.
 * @returns{RawInput} - content of the toolchain file as a `RawInput` object as not all the options can be specified in
 * the file.
 */
export const toolchainArgs = (toolchainFilePath: string): RawInput => {
    const tomlBytes = fs.readFileSync(toolchainFilePath, "utf8");
    const tomlData = toml.parse(tomlBytes) as ToolchainFile;

    if (tomlData?.toolchain == null) {
        return defaults.defaultRawInput();
    }

    const toolchainInput = conversions.toolchainFileToRawInput(tomlData);
    return conversions.merge(defaults.defaultRawInput(), toolchainInput);
};
