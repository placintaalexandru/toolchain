import { Command, Option } from "commander";
import { RawInput } from "./types";
import { RustUp } from "./installers/rustup";
import * as core from "@actions/core";
import * as parser from "action-input-parser";
import * as toolchainUtils from "./utils/toolchain";
import * as conversions from "./utils/conversions";
import { Outputs } from "./output";
import * as inputUtils from "./utils/input";

/**
 * Main command that is called when the GitHub action is executed.
 */
export const installToolchainCommand = (): Command => {
    return new Command()
        .description("Installs a specific toolchain version")
        .allowUnknownOption(false)
        .addOption(
            new Option(
                "--toolchain <toolchain>",
                "Toolchain to install",
            ).default(parser.getInput("toolchain", { type: "string" })),
        )
        .addOption(
            new Option("--profile <profile>", "Toolchain profile to install")
                .choices(["minimal", "default", "complete"])
                .default(parser.getInput("profile", { type: "string" })),
        )
        .addOption(
            new Option("--components [components]", "Components to install")
                .argParser(inputUtils.collect)
                .default(parser.getInput("components", { type: "array" })),
        )
        .addOption(
            new Option(
                "--targets [targets]",
                "Platform(s) to install the toolchain for",
            )
                .argParser(inputUtils.collect)
                .default(parser.getInput("targets", { type: "array" })),
        )
        .addOption(
            new Option(
                "--default",
                "Sets installed toolchain as a default toolchain",
            ).default(parser.getInput("default", { type: "boolean" })),
        )
        .addOption(
            new Option(
                "--override",
                "Set installed toolchain as an override for the current directory",
            ).default(
                parser.getInput("override", {
                    type: "boolean",
                    default: false,
                }),
            ),
        )
        .addOption(
            new Option(
                "--force",
                "Force an update, even if some components are missing",
            ).default(
                parser.getInput("force", { type: "boolean", default: false }),
            ),
        )
        .action(async (options: RawInput) => {
            core.debug(JSON.stringify(options));

            const rustup = await RustUp.getOrInstall();
            const rustToolChainFile = toolchainUtils.rustToolchainFile();

            // User provided a rust-toolchain file
            if (rustToolChainFile != null) {
                const rustToolchainArgs =
                    toolchainUtils.toolchainArgs(rustToolChainFile);
                options = conversions.merge(options, rustToolchainArgs);
            }

            const toolchainOptions =
                conversions.rawInputToToolchainOptions(options);

            let shouldSelfUpdate = false;

            if (!(await rustup.supportProfiles())) {
                shouldSelfUpdate = true;
            }

            if (
                toolchainOptions.components.length > 0 &&
                !(await rustup.supportComponents())
            ) {
                shouldSelfUpdate = true;
            }

            if (shouldSelfUpdate) {
                core.startGroup("Updating rustup");

                try {
                    await rustup.selfUpdate();

                    // We already did it just now, there is no reason to do that again,
                    // so it would skip few network calls.
                    toolchainOptions.noSelfUpdate = true;
                } finally {
                    core.endGroup();
                }
            }

            if (toolchainOptions.profile) {
                await rustup.setProfile(toolchainOptions.profile);
            }

            // Hilarious case.
            // Due to `rustup` issue (https://github.com/rust-lang/rustup/issues/2146)
            // right now installing `nightly` toolchain with extra components might fail
            // if that specific `nightly` version does not have this component
            // available.
            //
            // See https://github.com/actions-rs/toolchain/issues/53 also.
            //
            // By default, `rustup` does not downgrade, as it does when you are
            // updating already installed `nightly`, so we need to pass the
            // corresponding flag manually.
            //
            // We are doing it only if both of the following conditions apply:
            //
            //   1. The Requested toolchain is `"nightly"` (exact string match).
            //   2. At least one component is requested.
            //
            // All other cases are not triggering automatic downgrade,
            // for example, installing a specific nightly version
            // as in `"nightly-2020-03-20"` or `"stable"`.
            //
            // The Motivation is that users probably want the latest one nightly
            // with rustfmt and clippy (miri, etc.) and they don't really care
            // about what exact nightly it is.
            // In case if it's not nightly at all, or it is a some specific
            // nightly version, they know what they are doing.
            if (
                toolchainOptions.toolchain == "nightly" &&
                toolchainOptions.components.length > 0
            ) {
                toolchainOptions.allowDowngrade = true;
            }

            await rustup.installToolchain(toolchainOptions);

            if (toolchainOptions.targets.length > 0) {
                await rustup.addTargets(toolchainOptions);
            }

            core.info(await rustup.activeToolchain());

            (await Outputs.outputs()).forEach((output) => {
                core.setOutput(output.name, output.value);
            });
        });
};
