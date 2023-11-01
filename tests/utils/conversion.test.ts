import { describe } from "jest-circus";
import * as conversions from "../../src/utils/conversions";

describe("Tests of conversion utils module", () => {
    test("String property is replaced", () => {
        const extra = {
            toolchain: "a",
            profile: null,
            components: null,
            targets: null,
            default: null,
            override: null,
            force: null,
        };

        for (const baseToolchain of [null, "", "bla"]) {
            const base = {
                toolchain: baseToolchain,
                profile: null,
                components: null,
                targets: null,
                default: null,
                override: null,
                force: null,
            };
            const result = conversions.merge(base, extra);
            expect(result.toolchain).toBe(extra.toolchain);
        }
    });

    test("String property is not replaced", () => {
        const base = {
            toolchain: "whatever",
            profile: null,
            components: null,
            targets: null,
            default: null,
            override: null,
            force: null,
        };

        for (const extraToolchain of [null, "", ""]) {
            const extra = {
                toolchain: extraToolchain,
                profile: null,
                components: null,
                targets: null,
                default: null,
                override: null,
                force: null,
            };
            const result = conversions.merge(base, extra);
            expect(result.toolchain).toBe(base.toolchain);
        }
    });

    test("List property is replaced", () => {
        const extra = {
            toolchain: null,
            profile: null,
            components: ["bla"],
            targets: null,
            default: null,
            override: null,
            force: null,
        };

        for (const baseComponents of [null, [], ["whatever"]]) {
            const base = {
                toolchain: null,
                profile: null,
                components: baseComponents,
                targets: null,
                default: null,
                override: null,
                force: null,
            };
            const result = conversions.merge(base, extra);
            expect(result.components).toBe(extra.components);
        }
    });

    test("List property is not replaced", () => {
        const base = {
            toolchain: null,
            profile: null,
            components: ["something"],
            targets: null,
            default: null,
            override: null,
            force: null,
        };

        for (const extraComponents of [null, []]) {
            const extra = {
                toolchain: null,
                profile: null,
                components: extraComponents,
                targets: null,
                default: null,
                override: null,
                force: null,
            };
            const result = conversions.merge(base, extra);
            expect(result.components).toBe(base.components);
        }
    });

    test("Convert to ToolchainOptions: default values", () => {
        const rawInput = {
            toolchain: null,
            profile: null,
            components: null,
            targets: null,
            default: null,
            override: null,
            force: null,
        };
        const toolchanOptions =
            conversions.rawInputToToolchainOptions(rawInput);

        expect(toolchanOptions.toolchain).toBe("stable");
        expect(toolchanOptions.profile).toBe("default");
        expect(toolchanOptions.components.length).toBe(0);
        expect(toolchanOptions.targets.length).toBe(0);
        expect(toolchanOptions.default).toBe(false);
        expect(toolchanOptions.override).toBe(false);
        expect(toolchanOptions.force).toBe(false);
        expect(toolchanOptions.allowDowngrade).toBe(false);
        expect(toolchanOptions.noSelfUpdate).toBe(false);
    });

    test("Convert to ToolchainOptions: custom values", () => {
        const rawInput = {
            toolchain: "1.73.0",
            profile: "complete",
            components: ["rustfmt", "clippy"],
            targets: ["stable-x86_64-pc-windows-msvc"],
            default: true,
            override: true,
            force: true,
        };
        const toolchanOptions =
            conversions.rawInputToToolchainOptions(rawInput);

        expect(toolchanOptions.toolchain).toBe(rawInput.toolchain);
        expect(toolchanOptions.profile).toBe(rawInput.profile);
        expect(toolchanOptions.components.toString()).toBe(
            rawInput.components.toString(),
        );
        expect(toolchanOptions.targets.toString()).toBe(
            rawInput.targets.toString(),
        );
        expect(toolchanOptions.default).toBe(rawInput.default);
        expect(toolchanOptions.override).toBe(rawInput.override);
        expect(toolchanOptions.force).toBe(rawInput.force);
        expect(toolchanOptions.allowDowngrade).toBe(false);
        expect(toolchanOptions.noSelfUpdate).toBe(false);
    });
});
