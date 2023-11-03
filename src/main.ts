import { installToolchainCommand } from "./toolchain_install";

function main() {
    installToolchainCommand().parse(process.argv);
}

void main();
