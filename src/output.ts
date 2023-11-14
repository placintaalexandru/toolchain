import { Output } from "./types";
import * as execUtils from "./utils/exec";
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
     * @param matchIndex{number} - index of the match in the regular expression.
     * @returns{Promise<Output>} - absolute path to the toolchain file.
     */
    static parseCmdOutputWithRegex = async (
        exe: string,
        args: string[],
        r: RegExp,
        outputName: string,
        matchIndex: number,
    ): Promise<Output> => {
        const stdout = await execUtils.execStdout(exe, args);

        core.debug(
            `Command: ${exe}\nArgs:${args.toString()}\nOutput: ${stdout}`,
        );

        const match = stdout.match(r);

        if (!match || matchIndex >= match.length) {
            const msg = `Could not match ${stdout}`;
            core.error(msg);
            throw new Error(msg);
        }

        return Promise.resolve({
            name: outputName,
            value: match[matchIndex],
        });
    };

    static rustc = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "rustc",
            ["-V"],
            /rustc (\d+\.\d+\.\d+(-nightly|-beta\.\d+)?)/,
            "rustc",
            1,
        );
    };

    static rustcHash = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "rustc",
            ["-V"],
            /rustc (\d+\.\d+\.\d+(-nightly|-beta\.\d+)?) \((\w+) \d+-\d+-\d+\)/,
            "rustc_hash",
            3,
        );
    };

    static cargo = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "cargo",
            ["-V"],
            /cargo (\d+\.\d+\.\d+(-nightly|-beta\.\d+)?) \(.+ (\d{4}-\d{2}-\d{2})\)/,
            "cargo",
            1,
        );
    };

    static rustUp = async (): Promise<Output> => {
        return await Outputs.parseCmdOutputWithRegex(
            "rustup",
            ["-V"],
            /rustup (\d+\.\d+\.\d+) \(.+\)/,
            "rustup",
            1,
        );
    };
}
