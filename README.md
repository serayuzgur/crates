# crates


[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/v/serayuzgur.crates.svg)](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates)
[![Build Status](https://travis-ci.org/serayuzgur/crates.svg?branch=master)](https://travis-ci.org/serayuzgur/crates)

[![Become a Patron !](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/bePatron?u=11468905)

Hello Rust & VSCode lovers,

This is **crates**. **crates** is an extension for crates.io dependencies. This extension aims helping developers to manage dependencies while using _Cargo.toml_.

**Important:** It is only helpful if you are using dependencies from _crates.io_. Dependencies from *git* or other platforms are not supported.

## Features

**crates** is very simple. It has two features and does the job.
* Displays the latest version of the crate next to it
* Shows all versions (clickable) on tooltip of the crate hovered. 

Aims to be fast and simple. 

![ss](https://github.com/serayuzgur/crates/raw/master/feature.gif)

## Extension Settings

It is so **simple** that you do not need any configuration, but if you insist...

`crates.upToDateDecorator`: The text to show when dependency is up to date. Default is 👍.

`crates.listPreReleases` : If true, pre-release versions will be listed in hover and at decoration. Default is false.

## Known Issues

* TOML must be valid. If not crates will not work properly.

*  For **target dependencies**

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
