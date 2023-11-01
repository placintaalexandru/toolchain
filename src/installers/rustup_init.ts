import * as path from "path";
import * as process from "process";

import { promises as fs } from "fs";
import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

export class RustUpInit {
    public static install = async (): Promise<void> => {
        const args = [
            "--default-toolchain",
            "none",
            // No need for the prompts
            "-y",
        ];

        switch (process.platform) {
            case "darwin":
            case "linux": {
                const rustupSh = await tc.downloadTool("https://sh.rustup.rs");

                // While the `rustup-init.sh` is properly executed as is,
                // when Action is running on the VM itself,
                // it fails with `EACCES` when called in the Docker container.
                // Adding the execution bit manually just in case.
                // See: https://github.com/actions-rs/toolchain/pull/19#issuecomment-543358693
                core.debug(`Executing chmod 755 on the ${rustupSh}`);
                await fs.chmod(rustupSh, 0o755);

                await exec.exec(rustupSh, args);
                break;
            }

            case "win32": {
                const rustupExe = await tc.downloadTool(
                    "https://win.rustup.rs",
                );
                await exec.exec(rustupExe, args);
                break;
            }

            default:
                core.error(
                    `Unknown platform ${process.platform}, can't install rustup`,
                );
                throw new Error(
                    `Unknown platform ${process.platform}, can't install rustup`,
                );
        }

        // `$HOME` should always be declared
        core.addPath(path.join(process.env.HOME!, ".cargo", "bin"));
    };
}
