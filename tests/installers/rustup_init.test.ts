import { describe } from "jest-circus";
import * as mockedTc from "@actions/tool-cache";
import * as mockedExec from "@actions/exec";
import { RustUpInit } from "../../src/installers/rustup_init";
import process from "process";

jest.mock("@actions/exec");
jest.mock("@actions/core");
jest.mock("@actions/tool-cache", () => ({
    downloadTool: jest.fn().mockReturnValue("some path"),
}));

describe("Tests of rustup init", () => {
    let originalPlatform: NodeJS.Platform | null = null;

    beforeAll(() => {
        originalPlatform = process.platform;
    });

    afterAll(() => {
        Object.defineProperty(process, "platform", {
            value: originalPlatform,
        });
    });

    test("Script URLs: darwin + linux", async () => {
        for (const platform of ["darwin", "linux"]) {
            Object.defineProperty(process, "platform", {
                value: platform,
            });
            // Install will fail due to mocked @actions/tool-cache.downloadTool
            // To improve coverage => create a wrapper above fs.chmod,
            // and mock the wrapper
            try {
                await RustUpInit.install();
            } catch (except) {
                expect(mockedTc.downloadTool).toHaveBeenCalledWith(
                    "https://sh.rustup.rs",
                );
                return;
            }

            fail();
        }
    });

    test("Script URLs: windows", async () => {
        Object.defineProperty(process, "platform", {
            value: "win32",
        });
        await RustUpInit.install();

        expect(mockedTc.downloadTool).toHaveBeenCalledWith(
            "https://win.rustup.rs",
        );
        expect(mockedExec.exec as jest.Mock).toHaveBeenCalledWith(
            mockedTc.downloadTool(""),
            ["--default-toolchain", "none", "-y"],
        );
    });

    test("Script URLs: unsupported platform", async () => {
        const platform = "win69";

        Object.defineProperty(process, "platform", {
            value: platform,
        });

        try {
            // Install will fail due to mocked @actions/tool-cache.downloadTool
            await RustUpInit.install();
        } catch (error) {
            // Just to avoid lint errors
            const message = error instanceof Error ? error.message : "";
            expect(message).toBe(
                `Unknown platform ${process.platform}, can't install rustup`,
            );
            return;
        }

        fail(
            `Installation should have failed: platform ${platform} does not exist`,
        );
    });
});
