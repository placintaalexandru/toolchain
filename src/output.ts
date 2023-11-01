import { Output } from "./types";
import { execStdout } from "./utils/exec";
import * as core from "@actions/core";

export class Outputs {
    public static async outputs(): Promise<Output[]> {
        return Promise.resolve([
            await Outputs.rustc(),
            await Outputs.rustcHash(),
            await Outputs.cargo(),
            await Outputs.rustUp(),
        ]);
    }

    /**
     * Executes a command with arguments, extracts the command's output value using regular expression and returns
     * a promise that has an `Output` that will be exported by the GitHub action.
     *
     * @param{string} exe - path to the executable file, or the name if the executable exists in `PATH`.
     * @param{string[]} args - list of arguments the executable accepts.
     * @param{RegExp} r - regular expression used to extract the desired piece of the command's output.
     * @param{string} outputName - name of the output.
     * @returns{Promise<Output>} - absolute path to the toolchain file.
     */
    static parseCmdOutputWithRegex = async (
        exe: string,
        args: string[],
        r: RegExp,
        outputName: string,
    ): Promise<Output> => {
        const stdout = await execStdout(exe, args);

        core.debug(
            `Command: ${exe}\nArgs:${args.toString()}\nOutput: ${stdout}`,
        );

        const match = stdout.match(r);

        if (!match || !match[1]) {
            const msg = `Could not match ${stdout}`;
            core.error(msg);
            throw new Error(msg);
        }

        return Promise.resolve({
            name: outputName,
            value: match[1],
        });
    };

    static rustc = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "rustc",
            ["-V"],
            /rustc (\d+\.\d+\.\d+(-nightly)?)/,
            "rustc",
        );
    };

    static rustcHash = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "rustc",
            ["-V"],
            /rustc \d+\.\d+\.\d+(?:-\w+)? \((\w+) \d+-\d+-\d+\)/,
            "rustc_hash",
        );
    };

    static cargo = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "cargo",
            ["-V"],
            /cargo (\d+\.\d+\.\d+(-nightly)?) \(.+ (\d{4}-\d{2}-\d{2})\)/,
            "cargo",
        );
    };

    static rustUp = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "rustup",
            ["-V"],
            /rustup (\d+\.\d+\.\d+) \(.+\)/,
            "rustup",
        );
    };
}
