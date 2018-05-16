# crates

[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/v/serayuzgur.crates.svg)](https://github.com/serayuzgur/crates)
[![Build Status](https://travis-ci.org/serayuzgur/crates.svg?branch=master)](https://travis-ci.org/serayuzgur/crates)

**crates** is an extension for crates.io dependencies. Aims to help developers to manage dependencies while using _Cargo.toml_. It is only helpful if you are using dependencies from _crates.io_.

## Features

Displays the latest version of the crate next to it and shows all versions (clickable) on hover. 
Aims to be fast, simple. 

![ss](https://github.com/serayuzgur/crates/raw/master/feature.gif)

## Extension Settings

No settings for now.

## Known Issues

* TOML must be valid.

*  For target dependencies

    **Supported:**

    ```toml
    [target.'cfg(target_os = "macos")'.dependencies]
    objc = "0.2"
    cocoa = "0.15.0"
    core-foundation = "0.6.0"
    core-graphics = "0.14.0"
    ```

    **Not Supported:**

    ```toml
    [target.'cfg(target_os = "windows")'.dependencies.winapi]
    version = "0.3"
    features = [
        "winnt",
        "winuser",
        "wingdi",
        "shellapi",
        "dwmapi",
        "processthreadsapi",
        "libloaderapi",
        "windowsx",
        "hidusage",
        "combaseapi",
        "objbase",
        "unknwnbase",
    ]
    ```
