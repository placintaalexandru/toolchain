# `rust-toolchain` Action

![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)
![Continuous integration](https://github.com/placintaalexandru/toolchain/workflows/Continuous%20integration/badge.svg)
![Dependabot enabled](https://img.shields.io/badge/Dependabot-Enabled-brightgreen)
![GitHub tag checks state](https://img.shields.io/github/checks-status/placintaalexandru/toolchain/main)
![Codecov](https://img.shields.io/codecov/c/github/placintaalexandru/toolchain)

This GitHub Action installs [Rust toolchain](https://rust-lang.github.io/rustup/concepts/toolchains.html#toolchain-specification)
with [rustup](https://github.com/rust-lang/rustup) help.

It supports additional targets, components, and profiles and handles all
these small papercuts for you.

**Table of Contents**

* [Example workflow](#example-workflow)
* [Inputs](#inputs)
* [Outputs](#outputs)
* [Profiles](#profiles)
* [Components](#components)
* [The toolchain file](#the-toolchain-file)
* [License](#license)
* [Contribute and support](#contribute-and-support)

## Example workflow

```yaml
on: [push]

name: build

jobs:
    check:
        name: Rust project
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - name: Install latest nightly
              uses: placintaalexandru/toolchain@v1
              with:
                  toolchain: nightly
                  override: true
                  components: rustfmt, clippy

            # `cargo check` command here will use installed `nightly`
            # as it is set as an "override" for current directory
            - name: Run cargo check
              run: cargo check
```

See [additional recipes here](https://github.com/placintaalexandru/meta).

## Inputs

| Name         | Required | Description                                                                                                                                         | Type   | Default |
|--------------|:--------:|-----------------------------------------------------------------------------------------------------------------------------------------------------|--------|---------|
| `toolchain`  |  false   | [Toolchain](https://github.com/rust-lang/rustup.rs#toolchain-specification) name to use, ex. `stable`, `nightly`, `nightly-2019-04-20`, or `1.32.0` | string | stable  |
| `profile`    |  false   | Execute `rustup set profile {value}` before installing the toolchain, ex. `minimal`                                                                 | string | default |
| `components` |  false   | Comma-separated list of the additional components to install, ex. `clippy, rustfmt`                                                                 | string | ''      |
| `targets`    |  false   | Comma-separated list of the additional targets for the toolchain, ex. `x86_64-apple-darwin`                                                         | string | ''      |
| `default`    |  false   | Set installed toolchain as a default toolchain                                                                                                      | bool   | false   |
| `override`   |  false   | Set installed toolchain as an override for the current directory                                                                                    | bool   | false   |
| `force`      |  false   | Force an update, even if some components are missing                                                                                                | bool   | false   |

Note: since `v1.0.4` version, `toolchain` input is not marked as required
 to support toolchain files.
See the details [below](#the-toolchain-file).

## Outputs

Installed `rustc`, `cargo` and `rustup` versions can be fetched from the Action outputs:

| Name         | Description        | Example                         |
|--------------|--------------------|---------------------------------|
| `rustc`      | Rustc version      | `1.40.0 (73528e339 2019-12-16)` |
| `rustc_hash` | Rustc version hash | `73528e339`                     |
| `cargo`      | Cargo version      | `1.40.0 (bc8e4c8be 2019-11-22)` |
| `rustup`     | rustup version     | `1.21.1 (7832b2ebe 2019-12-20)` |

Note: `rustc_hash` output value can be used with [actions/cache](https://github.com/actions/cache) Action
to store cache for different Rust versions, as it is unique across different Rust versions and builds (including `nightly`).

## Profiles

This Action supports rustup [profiles](https://blog.rust-lang.org/2019/10/15/Rustup-1.20.0.html#profiles),
which can be used to speed up the workflow execution by installing the
minimally required to be set of components, for example:

```yaml
- name: Install minimal nightly
  uses: placintaalexandru/toolchain@v1
  with:
    profile: minimal
    toolchain: nightly
```

This Action will automatically run `rustup self update` if `profile` input is set
and the installed `rustup` version does not support them.

To provide backwards compatibility for `v1` version, there is no value for
`profile` input set by default, which means that the `default` profile is used
by `rustup` (and that includes `rust-docs`, `clippy` and `rustfmt`).

You may want to consider using `profile: minimal` to speed up toolchain installation.

## Components

This Action supports rustup [components](https://blog.rust-lang.org/2019/10/15/Rustup-1.20.0.html#installing-the-latest-compatible-nightly) too,
and in combination with the [profiles](#profiles) input it allows to install only the needed components:

```yaml
- name: Install minimal stable with clippy and rustfmt
  uses: placintaalexandru/toolchain@v1
  with:
    profile: minimal
    toolchain: stable
    components: rustfmt, clippy
```

As an extra perk, `rustup >= 1.20.0` is able to find the most recent `nightly` toolchain
with the requested components available; next example is utilizing this feature
to install the minimal set of `nightly` toolchain components with the `rustfmt` and `clippy` extras:

```yaml
- name: Install minimal nightly with clippy and rustfmt
  uses: placintaalexandru/toolchain@v1
  with:
    profile: minimal
    toolchain: nightly
    components: rustfmt, clippy
```

In case if `nightly` toolchain is requested and one of the components is missing in
latest `nightly` release, this Action will attempt the downgrade till it find
the most recent `nightly` with all components needed.

Note that this behavior will work only if the following two conditions apply:

 1. `toolchain` input is `nightly` exactly.
 2. At least one component is provided in `components` input.

Same to the `profile` input, if installed `rustup` does not support
"components" it will be automatically upgraded by this Action.

## The toolchain file

This Action supports [toolchain files](https://rust-lang.github.io/rustup/overrides.html#the-toolchain-file),
so it is not necessary to use `toolchain` input anymore.

Input has higher priority, so if you want to use toolchain file,
you need to remove the input from the workflow file.

If neither `toolchain` input or `rust-toolchain` file are provided,
Action execution will fail.

## License

This Action is distributed under the terms of the MIT license.
See [LICENSE](https://github.com/placintaalexandru/toolchain/blob/main/LICENSE) for details.

## Contribute and support

Any contributions are welcomed!

If you want to report a bug or have a feature request,
check the [Contributing guide](https://github.com/placintaalexandru/toolchain/blob/main/CONTRIBUTING.md).
