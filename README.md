# crates

[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/v/serayuzgur.crates.svg)](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates)
[![GitHub stars](https://img.shields.io/github/stars/serayuzgur/crates.svg)](https://github.com/serayuzgur/crates/stargazers)
[![Build Status](https://travis-ci.org/serayuzgur/crates.svg?branch=master)](https://travis-ci.org/serayuzgur/crates)

[![Become a Patron !](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/bePatron?u=11468905)

Hello Rust & VSCode lovers,

This is **crates**, an extension for _crates.io_ dependencies. Aims helping developers to manage dependencies while using _Cargo.toml_.

## Notes

- It is only helpful if you are using dependencies from _crates.io_. Dependencies from _git_ or other platforms are not supported.
- TOML must be valid. If not crates will not show versions. It will inform you with. status bar and dialog.

## Features

**crates** is very simple. It has just two features.

- Displays the latest version of the crate next to it
- Shows all versions (clickable) on tooltip of the crate hovered.

Aims to be fast and simple.

### Update Single Dependency

![update](https://github.com/serayuzgur/crates/raw/master/update.gif)

### Update All Dependencies (lazy mode)

![updateAll](https://github.com/serayuzgur/crates/raw/master/updateAll.gif)

### Simple settings

![pref](https://github.com/serayuzgur/crates/raw/master/pref.png)

## Extension Settings

It is so **simple** that you do not need any configuration, but if you insist...

`crates.upToDateDecorator`: The text to show when dependency is up to date. Default is 👍.

`crates.latestDecorator`: The text to show when dependency is **not**  up to date. Default is `Latest: ${version}`.

`crates.listPreReleases` : If true, pre-release versions will be listed in hover and at decoration. Default is false.

## Known Issues

- All glitches will be cleared on save.

## Thanks to

[@ademozay](https://github.com/ademozay)

[@userzimmermann](https://github.com/userzimmermann)
