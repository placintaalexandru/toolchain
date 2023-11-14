import { Outputs } from "../src/output";
import * as mockedExecUtils from "../src/utils/exec";

jest.mock("@actions/core", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
}));
describe("Outputs tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Rustc version", async () => {
        for (const stdout of [
            "rustc 1.75.0-nightly (aa1a71e9e 2023-10-26)",
            "rustc 1.75.0 (aa1a71e9e 2023-10-26)",
            "rustc 1.75.0-beta.1 (782883f60 2023-11-12)",
        ]) {
            jest.spyOn(mockedExecUtils, "execStdout").mockReturnValue(
                Promise.resolve(stdout),
            );
            const output = await Outputs.rustc();
            expect(output.value).toBe(stdout.split(" ")[1]);
        }
    });

    test("Rustc hash", async () => {
        for (const stdout of [
            "rustc 1.75.0-nightly (aa1a71e9e 2023-10-26)",
            "rustc 1.75.0 (aa1a71e9e 2023-10-26)",
            "rustc 1.75.0-beta.1 (782883f60 2023-11-12)",
        ]) {
            jest.spyOn(mockedExecUtils, "execStdout").mockReturnValue(
                Promise.resolve(stdout),
            );
            const output = await Outputs.rustcHash();
            expect(output.value).toBe(
                stdout.split(" ")[2].split(" ")[0].substring(1),
            );
        }
    });

    test("Cargo version", async () => {
        for (const stdout of [
            "cargo 1.75.0-nightly (df3509237 2023-10-24)",
            "cargo 1.75.0 (df3509237 2023-10-24)",
            "cargo 1.75.0-beta.1 (6790a5127 2023-11-10)",
        ]) {
            jest.spyOn(mockedExecUtils, "execStdout").mockReturnValue(
                Promise.resolve(stdout),
            );
            const output = await Outputs.cargo();
            expect(output.value).toBe(stdout.split(" ")[1]);
        }
    });

    test("Rustup version", async () => {
        for (const stdout of [
            "rustup 1.26.0 (5af9b9484 2023-04-05)\n" +
                "info: This is the version for the rustup toolchain manager, not the rustc compiler.\n" +
                "info: The currently active `rustc` version is `rustc 1.75.0-nightly (aa1a71e9e 2023-10-26)`",
        ]) {
            jest.spyOn(mockedExecUtils, "execStdout").mockReturnValue(
                Promise.resolve(stdout),
            );
            const output = await Outputs.rustUp();
            expect(output.value).toBe(stdout.split(" ")[1]);
        }
    });

    test("All", async () => {
        jest.spyOn(mockedExecUtils, "execStdout").mockImplementation(
            async (exe) => {
                if (exe === "rustc") {
                    return Promise.resolve(
                        "rustc 1.75.0-beta.1 (782883f60 2023-11-12)",
                    );
                } else if (exe === "cargo") {
                    return Promise.resolve(
                        "cargo 1.75.0-nightly (df3509237 2023-10-24)",
                    );
                } else if (exe === "rustup") {
                    return Promise.resolve(
                        "rustup 1.26.0 (5af9b9484 2023-04-05)\n" +
                            "info: This is the version for the rustup toolchain manager, not the rustc compiler.\n" +
                            "info: The currently active `rustc` version is `rustc 1.75.0-nightly (aa1a71e9e 2023-10-26)`",
                    );
                }

                throw new Error("Unexpected exe");
            },
        );

        expect(
            (await Outputs.outputs())
                .map((output) => {
                    return output.value;
                })
                .toString(),
        ).toBe(
            [
                "1.75.0-beta.1",
                "782883f60",
                "1.75.0-nightly",
                "1.26.0",
            ].toString(),
        );
    });

    test("Error when not possible to match", async () => {
        const rustcVersion = "blah blah";
        const expectedMessage = `Could not match ${rustcVersion}`;
        let threwError = false;

        jest.spyOn(mockedExecUtils, "execStdout").mockReturnValue(
            Promise.resolve(rustcVersion),
        );

        await Outputs.outputs().catch((e: Error) => {
            expect(e.message).toBe(expectedMessage);
            threwError = true;
        });

        expect(threwError).toBe(true);
    });
});
