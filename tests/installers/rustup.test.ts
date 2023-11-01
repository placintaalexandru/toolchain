import { describe } from "jest-circus";
import { RustUp } from "../../src/installers/rustup";
import { RustUpInit } from "../../src/installers/rustup_init";
import * as mockedIo from "@actions/io";
import * as mockedExec from "@actions/exec";
import * as fcj from "@fast-check/jest";
import * as mockedExecUtils from "../../src/utils/exec";
import * as semver from "semver";

jest.mock("@actions/io", () => ({
    which: jest.fn(),
}));
jest.mock("@actions/exec", () => ({
    exec: jest.fn(),
}));
jest.mock("@actions/core", () => ({
    info: jest.fn(),
    warning: jest.fn(),
}));
jest.mock("../../src/installers/rustup_init", () => ({
    RustUpInit: { install: jest.fn() },
}));

describe("Tests of rustup", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Get or install: rustup exists", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );
        await RustUp.getOrInstall();

        expect(mockedIo.which).toHaveBeenCalledTimes(1);
        expect(RustUpInit.install).toHaveBeenCalledTimes(0);
    });

    test("Get or install: rustup does not exist", async () => {
        let count = 0;
        (mockedIo.which as jest.Mock).mockImplementation(() => {
            // First time when Rustup.get is called => fake it does not exist and throw
            if (count == 0) {
                count += 1;
                throw new Error("Rustup does not exist");
            }

            // The second time it gets called, we mock its existence
            return "/myrustup/rustup";
        });
        (RustUpInit.install as jest.Mock).mockReturnValue(Promise.resolve(""));

        await RustUp.getOrInstall();
        expect(mockedIo.which).toHaveBeenCalledTimes(2);
        expect(RustUpInit.install).toHaveBeenCalledTimes(1);
    });

    test("No rustup when rustup init installation fails", async () => {
        const expectedMessage = "Rustup installation fail";
        (RustUpInit.install as jest.Mock).mockImplementation(() => {
            throw new Error(expectedMessage);
        });
        (mockedIo.which as jest.Mock).mockImplementation(() => {
            throw new Error("Rustup not installed");
        });

        let threwError = false;

        await RustUp.getOrInstall().catch((error: Error) => {
            expect(error.message).toBe(expectedMessage);
            threwError = true;
        });

        expect(threwError);
    });

    fcj.test.prop([
        fcj.fc.integer({ min: 1, max: 100 }),
        fcj.fc.integer({ min: 1, max: 100 }),
        fcj.fc.integer({ min: 1, max: 100 }),
    ])("Version: valid", async (major, minor, patch) => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUp = await RustUp.getOrInstall();

        jest.spyOn(rustUp, "callStdout").mockReturnValue(
            Promise.resolve(
                `rustup ${major}.${minor}.${patch} (5af9b9484 2023-04-05)`,
            ),
        );

        const version = await rustUp.version();

        expect(version.major).toBe(major);
        expect(version.minor).toBe(minor);
        expect(version.patch).toBe(patch);
    });

    test("Version: invalid", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );
        jest.mock("@actions/io", () => ({
            parse: jest.fn().mockReturnValue(null),
        }));

        const rustUp = await RustUp.getOrInstall();
        let threwError = false;

        try {
            await rustUp.version();
        } catch (e) {
            threwError = true;
        }

        expect(threwError);
    });

    test("Install toolchain: components", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUpPath = await mockedIo.which("rustup");
        const rustUp = await RustUp.getOrInstall();

        const toolchainOptions = {
            toolchain: "1.73.0",
            profile: "minimal",
            components: ["rustfmt", "clippy"],
            targets: [],
            default: false,
            override: false,
            force: false,
            noSelfUpdate: false,
            allowDowngrade: false,
        };

        await rustUp.installToolchain(toolchainOptions);

        expect(mockedExec.exec).toHaveBeenCalledTimes(1);
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            [
                "toolchain",
                "install",
                toolchainOptions.toolchain,
                "--component",
                toolchainOptions.components[0],
                "--component",
                toolchainOptions.components[1],
            ],
            undefined,
        );
    });

    test("Add targets", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUpPath = await mockedIo.which("rustup");
        const rustUp = await RustUp.getOrInstall();

        const toolchainOptions = {
            toolchain: "1.73.0",
            profile: "minimal",
            components: ["rustfmt", "clippy"],
            targets: ["some target"],
            default: false,
            override: false,
            force: false,
            noSelfUpdate: false,
            allowDowngrade: false,
        };

        await rustUp.addTargets(toolchainOptions);

        expect(mockedExec.exec).toHaveBeenCalledTimes(1);
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            [
                "target",
                "add",
                toolchainOptions.targets[0],
                "--toolchain",
                toolchainOptions.toolchain,
            ],
            undefined,
        );
    });

    test("Install toolchain: no self update, downgrade & force", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUpPath = await mockedIo.which("rustup");
        const rustUp = await RustUp.getOrInstall();

        const toolchainOptions = {
            toolchain: "1.73.0",
            profile: "minimal",
            components: [],
            targets: [],
            default: false,
            override: false,
            force: true,
            noSelfUpdate: true,
            allowDowngrade: true,
        };

        await rustUp.installToolchain(toolchainOptions);

        expect(mockedExec.exec).toHaveBeenCalledTimes(1);
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            [
                "toolchain",
                "install",
                toolchainOptions.toolchain,
                "--no-self-update",
                "--allow-downgrade",
                "--force",
            ],
            undefined,
        );
    });

    test("Install toolchain: default & override", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUpPath = await mockedIo.which("rustup");
        const rustUp = await RustUp.getOrInstall();

        const toolchainOptions = {
            toolchain: "1.73.0",
            profile: "minimal",
            components: [],
            targets: [],
            default: true,
            override: true,
            force: false,
            noSelfUpdate: false,
            allowDowngrade: false,
        };

        await rustUp.installToolchain(toolchainOptions);

        expect(mockedExec.exec).toHaveBeenCalledTimes(3);
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            ["default", toolchainOptions.toolchain],
            undefined,
        );
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            ["override", "set", toolchainOptions.toolchain],
            undefined,
        );
    });

    test("Set profile", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUpPath = await mockedIo.which("rustup");
        const rustUp = await RustUp.getOrInstall();
        const profile = "default";

        await rustUp.setProfile(profile);

        expect(mockedExec.exec).toHaveBeenCalledTimes(1);
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            ["set", "profile", profile],
            undefined,
        );
    });

    test("Self update", async () => {
        (mockedIo.which as jest.Mock).mockReturnValue(
            Promise.resolve("/somepath/rustup"),
        );

        const rustUpPath = await mockedIo.which("rustup");
        const rustUp = await RustUp.getOrInstall();

        await rustUp.selfUpdate();

        expect(mockedExec.exec).toHaveBeenCalledTimes(1);
        expect(mockedExec.exec).toHaveBeenCalledWith(
            rustUpPath,
            ["self", "update"],
            undefined,
        );
    });

    fcj.test.prop([
        fcj.fc.integer({ min: 0, max: 1 }),
        fcj.fc.integer({ min: 1, max: 19 }),
        fcj.fc.integer({ min: 0, max: 1 }),
    ])(
        "Version: no support for profiles & components",
        async (major, minor, patch) => {
            (mockedIo.which as jest.Mock).mockReturnValue(
                Promise.resolve("/somepath/rustup"),
            );

            const rustUp = await RustUp.getOrInstall();

            jest.spyOn(rustUp, "version").mockReturnValue(
                Promise.resolve(
                    semver.parse(`${major}.${minor}.${patch}`) as semver.SemVer,
                ),
            );

            expect(await rustUp.supportProfiles()).toBe(false);
            expect(await rustUp.supportComponents()).toBe(false);
        },
    );

    fcj.test.prop([
        fcj.fc.integer({ min: 1, max: 100 }),
        fcj.fc.integer({ min: 20, max: 100 }),
        fcj.fc.integer({ min: 1, max: 100 }),
    ])(
        "Version: support for profiles & components",
        async (major, minor, patch) => {
            (mockedIo.which as jest.Mock).mockReturnValue(
                Promise.resolve("/somepath/rustup"),
            );

            const rustUp = await RustUp.getOrInstall();

            jest.spyOn(rustUp, "version").mockReturnValue(
                Promise.resolve(
                    semver.parse(`${major}.${minor}.${patch}`) as semver.SemVer,
                ),
            );

            expect(await rustUp.supportProfiles()).toBe(true);
            expect(await rustUp.supportComponents()).toBe(true);
        },
    );

    test("Active toolchain", async () => {
        const path = "/somepath/rustup";
        (mockedIo.which as jest.Mock).mockReturnValue(Promise.resolve(path));

        const result = "string";
        const rustUp = await RustUp.getOrInstall();

        jest.spyOn(mockedExecUtils, "execStdout").mockReturnValue(
            Promise.resolve(result),
        );

        await rustUp.activeToolchain();

        expect(mockedExecUtils.execStdout).toHaveBeenCalledWith(
            path,
            ["show", "active-toolchain"],
            undefined,
        );
    });
});
