import { ExecOptions } from "@actions/exec";
import * as exec from "@actions/exec";

/**
 * Converts the user input to the actual toolchain options that will be used.
 *
 * @param{string} exe - path to the executable file, or the name if the executable exists in `PATH`.
 * @param{string[]} args - list of arguments the executable accepts.
 * @param{ExecOptions} options - additional options to execute the command with
 * (more details regarding these on [@actions/exec](https://github.com/actions/toolkit/tree/main/packages/exec) page).
 * @returns{Promise<string>} - promise having the output of the executed command.
 */
export const execStdout = async (
    exe: string,
    args: string[],
    options?: ExecOptions,
): Promise<string> => {
    let stdout = "";
    const resOptions = Object.assign({}, options, {
        listeners: {
            stdout: (buffer: Buffer): void => {
                stdout += buffer.toString();
            },
        },
    });

    await exec.exec(exe, args, resOptions);
    return stdout;
};
