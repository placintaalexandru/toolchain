import * as semver from "semver";
import * as io from "@actions/io";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { ExecOptions } from "@actions/exec";
import { ToolchainOptions } from "../types";
import { RustUpInit } from "./rustup_init";
import { execStdout } from "../utils/exec";

export class RustUp {
    private readonly path: string;

    private static readonly PROFILES_MIN_VERSION: semver.SemVer = semver.parse(
        "1.20.1",
    ) as semver.SemVer;
    private static readonly COMPONENTS_MIN_VERSION = semver.parse(
        "1.20.1",
    ) as semver.SemVer;
    private static readonly BINARY_NAME: string = "rustup";

    private constructor(exePath: string) {
        this.path = exePath;
    }

    public static getOrInstall = async (): Promise<RustUp> => {
        return RustUp.get().catch(async (error: Error) => {
            core.info(
                `Unable to find "rustup" executable, installing it now. Reason: ${error.toString()}`,
            );

            return RustUpInit.install()
                .catch((error: Error) => {
                    core.error(
                        `Error during rustup installation: ${error.toString()}`,
                    );
                    throw error;
                })
                .then(RustUp.get);
        });
    };

    // Will throw an error if `rustup` is not installed.
    public static get = async (): Promise<RustUp> => {
        const exePath = await io.which(RustUp.BINARY_NAME, true);
        return new RustUp(exePath);
    };

    public async installToolchain(options: ToolchainOptions): Promise<number> {
        const args = ["toolchain", "install", options.toolchain];

        if (options.components.length > 0) {
            for (const component of options.components) {
                args.push("--component");
                args.push(component);
            }
        }

        if (options.noSelfUpdate) {
            args.push("--no-self-update");
        }

        if (options.allowDowngrade) {
            args.push("--allow-downgrade");
        }

        if (options.force) {
            args.push("--force");
        }

        await this.call(args);

        if (options.default) {
            await this.call(["default", options.toolchain]);
        }

        if (options.override) {
            await this.call(["override", "set", options.toolchain]);
        }

        // TODO: Is there something like Rust' `return Ok(())`?
        return 0;
    }

    public async addTargets(options: ToolchainOptions): Promise<number> {
        const args = ["target", "add"]
            .concat(options.targets)
            .concat(["--toolchain", options.toolchain]);
        return this.call(args);
    }

    public async activeToolchain(): Promise<string> {
        const stdout = await this.callStdout(["show", "active-toolchain"]);

        if (stdout) {
            return stdout.split(" ", 2)[0];
        } else {
            const error = new Error("Unable to determine active toolchain");
            core.error(error.toString());
            throw error;
        }
    }

    public async supportProfiles(): Promise<boolean> {
        const version = await this.version();
        const supports = semver.gte(version, RustUp.PROFILES_MIN_VERSION);
        if (supports) {
            core.info(`Installed rustup ${version.version} support profiles`);
        } else {
            core.warning(`Installed rustup ${version.version} does not support profiles, \
expected at least ${RustUp.PROFILES_MIN_VERSION.version}`);
        }
        return supports;
    }

    public async supportComponents(): Promise<boolean> {
        const version = await this.version();
        const supports = semver.gte(version, RustUp.COMPONENTS_MIN_VERSION);
        if (supports) {
            core.info(`Installed rustup ${version.version} support components`);
        } else {
            core.info(`Installed rustup ${version.version} does not support components, \
expected at least ${RustUp.PROFILES_MIN_VERSION.version}`);
        }
        return supports;
    }

    /**
     * Executes `rustup set profile ${name}`
     *
     * Note that it includes the check if currently installed rustup support profiles at all
     */
    public async setProfile(profile: string): Promise<number> {
        return await this.call(["set", "profile", profile]);
    }

    public async version(): Promise<semver.SemVer> {
        const stdout = await this.callStdout(["-V"]);
        const stringSemVer = stdout.split(" ")[1];
        const version = semver.parse(stringSemVer);

        if (version == null) {
            const message = `Invalid semver: ${stringSemVer}`;
            core.error(message);
            throw new Error(message);
        }

        return version;
    }

    public async selfUpdate(): Promise<number> {
        return this.call(["self", "update"]);
    }

    public async call(args: string[], options?: ExecOptions): Promise<number> {
        return exec.exec(this.path, args, options);
    }

    /**
     * Call the `rustup` and return the stdout output
     */
    async callStdout(args: string[], options?: ExecOptions): Promise<string> {
        return await execStdout(this.path, args, options);
    }
}
