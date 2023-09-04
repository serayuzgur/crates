# Crates: Simplify Dependency Management in Rust & VSCode

[![Become a Patron](https://img.shields.io/badge/Support%20Us%20on-Patreon-orange.svg)](https://www.patreon.com/bePatron?u=11468905)
[![GitHub Sponsors](https://img.shields.io/badge/Support%20Us%20on-GitHub-red.svg)](https://github.com/sponsors/serayuzgur)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/serayuzgur.crates)](https://img.shields.io/visual-studio-marketplace/v/serayuzgur.crates)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/serayuzgur.crates)](https://img.shields.io/visual-studio-marketplace/i/serayuzgur.crates)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/serayuzgur.crates)](https://img.shields.io/visual-studio-marketplace/r/serayuzgur.crates)
[![GitHub stars](https://img.shields.io/github/stars/serayuzgur/crates.svg)](https://github.com/serayuzgur/crates/stargazers)

## Crates: Simplify Dependency Management in Rust & VSCode

Welcome to **Crates**, the ultimate Rust extension for VSCode! Simplify your dependency management with ease while using Cargo.toml for your project.

## Why Crates?

Are you tired of manually managing your Rust dependencies? Crates is here to save the day! Whether you're a seasoned Rust developer or just getting started, our extension is designed to make your life easier and your coding experience more enjoyable.

## Key Features

Crates offers a range of powerful features to streamline your Rust development workflow:

1. **Version Information**: Crates provides comprehensive version information to keep you informed about the crates in your project. This includes a tooltip with detailed version details and inline visual feedback for quick reference and decision-making.
   ![Tooltip with Version Information](https://github.com/serayuzgur/crates/raw/master/screenshots/tooltip.png)

2. **Shortcut Commands**: Update all dependencies with just one command for a seamless workflow.
   ![Update All Dependencies](https://github.com/serayuzgur/crates/raw/master/screenshots/update_all.png)

3. **Crev Integration**: Access valuable code reviews and community collaboration through the integration with [Crev](https://web.crev.dev/). Get feedback and make informed decisions about the crates you depend on.
   ![Crev Integration](https://github.com/serayuzgur/crates/raw/master/screenshots/crev_dev.png)

4. **Doc.rs Integration**: Explore comprehensive documentation for Rust, including crates, libraries, and more, with the seamless integration of [Doc.rs](https://doc.rs/). Gain in-depth knowledge and insights to enhance your coding experience.
   ![Doc.rs Integration](https://github.com/serayuzgur/crates/raw/master/screenshots/docs_rs.png)

## Getting Started

Using Crates is incredibly simple. Just install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates), and you're ready to go!

## Configuration Options

While Crates works out-of-the-box without any configuration, we also offer a few customizable options:

### settings.json

- `crates.listPreReleases`: Enable this option to list pre-release versions in hover and decorations. By default, it is set to false.

- `crates.indexServerURL`: Specify a custom URL for the crates.io index server. The default value connects to the official index.

- `crates.errorDecorator`: Customize the text displayed when a dependency has errors. The default is `❗️❗️❗`.

- `crates.compatibleDecorator`: Define the text template to show when a dependency is semver compatible. `${version}` will be replaced by the latest version info. The default is `✅`.

- `crates.incompatibleDecorator`: Set the text template to show when a dependency is not semver compatible. `${version}` will be replaced by the latest version info. The default is `❌ ${version}`.

### Cargo.toml

- `# crates: disable-check`: Disable version check for this specific dependency.

## Known Issues

Any minor issues or glitches you encounter will automatically be resolved when you save your work.

## Show Your Support

If you find Crates valuable and want to support its development, please consider becoming a Patron on [Patreon](https://www.patreon.com/bePatron?u=11468905) or a GitHub Sponsor on [GitHub](https://github.com/sponsors/serayuzgur). Your contribution will enable us to continue improving Crates and providing priority support to our patrons.

---

[<img src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_blue.png" width="201px"/>](https://www.digitalocean.com/?refcode=3c1a47ab4694&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

Help us simplify Rust dependency management with Crates, and let's make coding in Rust even more enjoyable! Together, we can achieve great things.
