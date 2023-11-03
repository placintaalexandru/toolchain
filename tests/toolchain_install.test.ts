import { installToolchainCommand } from "../src/toolchain_install";
import { RustUp } from "../src/installers/rustup";
import { Outputs } from "../src/output";
import * as mockedCore from "@actions/core";
import * as mockedToolchainUtil from "../src/utils/toolchain";

jest.mock("@actions/exec", () => ({
    exec: jest.fn(),
}));
jest.mock("@actions/core", () => ({
    debug: jest.fn(),
    startGroup: jest.fn(),
    endGroup: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    setOutput: jest.fn(),
}));
jest.mock("../src/installers/rustup", () => ({
    RustUp: {
        getOrInstall: jest.fn(),
    },
}));
jest.mock("../src/output", () => ({
    Outputs: {
        outputs: jest.fn(),
    },
}));
jest.mock("../src/utils/toolchain");

describe("Tests of toolchain command", () => {
    const originalEnv = process.env;

    const mockedRustUp = {
        supportProfiles: jest.fn(),
        supportComponents: jest.fn(),
        setProfile: jest.fn(),
        installToolchain: jest.fn(),
        selfUpdate: jest.fn(),
        activeToolchain: jest.fn(),
        addTargets: jest.fn(),
    };

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("Install toolchain: rust toolchain file", () => {
        mockedRustUp.supportProfiles.mockReturnValue(Promise.resolve(true));
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(Promise.resolve([]));
        (mockedToolchainUtil.rustToolchainFile as jest.Mock).mockReturnValue(
            "rust-toolchain.toml",
        );

        const toolchainArgs = {
            toolchain: "some toolchain",
            profile: "a profile",
        };
        (mockedToolchainUtil.toolchainArgs as jest.Mock).mockReturnValue(
            toolchainArgs,
        );

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedToolchainUtil.toolchainArgs).toHaveBeenCalledWith(
                    "rust-toolchain.toml",
                );
                expect(mockedRustUp.setProfile).toHaveBeenCalledWith(
                    toolchainArgs.profile,
                );
            })
            .parse([]);
    });

    test("Install toolchain: should self update due to profiles", () => {
        mockedRustUp.supportProfiles.mockReturnValue(Promise.resolve(false));
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(Promise.resolve([]));

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedRustUp.selfUpdate).toHaveBeenCalledTimes(1);
            })
            .parse([]);
    });

    test("Install toolchain: should self update due to components", () => {
        mockedRustUp.supportComponents.mockReturnValue(Promise.resolve(false));
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(Promise.resolve([]));

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedRustUp.selfUpdate).toHaveBeenCalledTimes(1);
            })
            .parse([
                "node",
                "exe",
                "--components",
                "clippy",
                "--components",
                "llvm",
            ]);
    });

    test("Install toolchain: profile is set", () => {
        mockedRustUp.supportComponents.mockReturnValue(Promise.resolve(false));
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(Promise.resolve([]));

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedRustUp.setProfile).toHaveBeenCalledWith(
                    "complete",
                );
            })
            .parse(["node", "exe", "--profile", "complete"]);
    });

    test("Install toolchain: downgrade on nightly", () => {
        mockedRustUp.supportProfiles.mockReturnValue(Promise.resolve(true));
        mockedRustUp.supportComponents.mockReturnValue(Promise.resolve(true));
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(Promise.resolve([]));

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedRustUp.installToolchain).toHaveBeenCalledTimes(1);
                expect(mockedRustUp.installToolchain).toHaveBeenCalledWith({
                    allowDowngrade: true,
                    components: ["c1", "c2"],
                    default: false,
                    force: false,
                    noSelfUpdate: false,
                    override: false,
                    profile: "default",
                    targets: [],
                    toolchain: "nightly",
                });
            })
            .parse([
                "node",
                "exe",
                "--toolchain",
                "nightly",
                "--components",
                "c1",
                "--components",
                "c2",
            ]);
    });

    test("Install toolchain: add targets", () => {
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(Promise.resolve([]));

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedRustUp.addTargets).toHaveBeenCalledTimes(1);
            })
            .parse(["node", "exe", "--targets", "t1", "--targets", "t2"]);
    });

    test("Outputs", () => {
        (RustUp.getOrInstall as jest.Mock).mockImplementation(async () => {
            return Promise.resolve(mockedRustUp);
        });
        (Outputs.outputs as jest.Mock).mockReturnValue(
            Promise.resolve([
                {
                    name: "rustc",
                    value: "version",
                },
            ]),
        );

        installToolchainCommand()
            .hook("postAction", () => {
                expect(mockedCore.setOutput).toHaveBeenCalledTimes(1);
                expect(mockedCore.setOutput).toHaveBeenCalledWith(
                    "rustc",
                    "version",
                );
            })
            .parse([]);
    });
});
