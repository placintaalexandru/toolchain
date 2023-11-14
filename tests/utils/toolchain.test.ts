import { describe } from "jest-circus";
import * as utils from "../../src/utils/toolchain";
import * as mockedFs from "fs";

jest.mock("fs");

describe("Tests of toolchain utils", () => {
    test("Rust toolchain files exist", () => {
        const files = ["rust-toolchain.toml", "rust-toolchain"];

        for (const file of files) {
            (mockedFs.existsSync as jest.Mock).mockReturnValue((v: string) => {
                return v == file;
            });

            const toolchainFile = utils.rustToolchainFile();
            expect(toolchainFile != null && toolchainFile.endsWith(file));
        }
    });

    test("No toolchain file exists", () => {
        (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
        const toolchainFile = utils.rustToolchainFile();
        expect(toolchainFile == null);
    });

    test("Non-emtpy toolchain file", () => {
        const toolchain = "nightly-2020-07-10";
        const profile = "minimal";
        const components = ["rustfmt", "rustc-dev"];
        const targets = ["wasm32-unknown-unknown", "thumbv2-none-eabi"];
        const tomlData = `
            [toolchain]
            channel = "${toolchain}"
            components = ${JSON.stringify(components)}
            targets = ${JSON.stringify(targets)}
            profile = "${profile}"
        `;

        (mockedFs.readFileSync as jest.Mock).mockReturnValue(tomlData);
        const toolchainArgs = utils.toolchainArgs("");

        expect(toolchainArgs.toolchain).toBe(toolchain);
        expect(toolchainArgs.profile).toBe(profile);
        expect(toolchainArgs.components?.toString()).toBe(
            components.toString(),
        );
        expect(toolchainArgs.targets?.toString()).toBe(targets.toString());
    });

    test("Only [toolchain] stanza is present", () => {
        const tomlData = `
            [toolchain]
        `;
        (mockedFs.readFileSync as jest.Mock).mockReturnValue(tomlData);
        const toolchainArgs = utils.toolchainArgs("");

        expect(toolchainArgs.toolchain == null);
        expect(toolchainArgs.profile == null);
        expect(toolchainArgs.components == null);
        expect(toolchainArgs.targets == null);
    });

    test("File is empty", () => {
        const tomlData = "";
        (mockedFs.readFileSync as jest.Mock).mockReturnValue(tomlData);
        const toolchainArgs = utils.toolchainArgs("");

        expect(toolchainArgs.toolchain == null);
        expect(toolchainArgs.profile == null);
        expect(toolchainArgs.components == null);
        expect(toolchainArgs.targets == null);
    });
});
