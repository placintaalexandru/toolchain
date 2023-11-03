import { Outputs } from "../src/output";
import * as mockedExecUtils from "../src/utils/exec";

jest.mock("@actions/core", () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));
describe("Outputs tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Rustc version", async () => {
        for (const stdout of [
            "rustc 1.75.0-nightly (aa1a71e9e 2023-10-26)",
            "rustc 1.75.0 (aa1a71e9e 2023-10-26)",
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
        jest.spyOn(Outputs, "rustc").mockReturnValue(
            Promise.resolve({
                name: "rustc",
                value: "rustc",
            }),
        );
        jest.spyOn(Outputs, "rustcHash").mockReturnValue(
            Promise.resolve({
                name: "rustc_hash",
                value: "rustcHash",
            }),
        );
        jest.spyOn(Outputs, "cargo").mockReturnValue(
            Promise.resolve({
                name: "cargo",
                value: "cargo",
            }),
        );
        jest.spyOn(Outputs, "rustUp").mockReturnValue(
            Promise.resolve({
                name: "rustup",
                value: "rustup",
            }),
        );

        expect(
            (await Outputs.outputs())
                .map((output) => {
                    return output.value;
                })
                .toString(),
        ).toBe(["rustc", "rustcHash", "cargo", "rustup"].toString());
    });
});
