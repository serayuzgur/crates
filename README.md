# Crates: Simplify Dependency Management in Rust & VSCode

[![Become a Patron](https://img.shields.io/badge/Support%20Us%20on-Patreon-orange.svg)](https://www.patreon.com/bePatron?u=11468905)
[![GitHub Sponsors](https://img.shields.io/badge/Support%20Us%20on-GitHub-red.svg)](https://github.com/sponsors/serayuzgur)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/serayuzgur.crates)](https://img.shields.io/visual-studio-marketplace/v/serayuzgur.crates)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/serayuzgur.crates)](https://img.shields.io/visual-studio-marketplace/i/serayuzgur.crates)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/serayuzgur.crates)](https://img.shields.io/visual-studio-marketplace/r/serayuzgur.crates)
[![GitHub stars](https://img.shields.io/github/stars/serayuzgur/crates.svg)](https://github.com/serayuzgur/crates/stargazers)

This project is now archived. Please use the renamed and maintained version [Dependi](https://github.com/filllabs/dependi) instead.

## Transition to Dependi for Next-Generation Dependency Management!

Dear Crates Users,

Since 2018, Crates has become the most loved and used dependency management extension within the Rust community. Due to increased demand and numerous feature requests, we have decided to dedicate our full efforts to enhancing this product. As a result, we are excited to introduce Dependi, our new and more powerful extension that builds on the foundation of Crates.

Important Update:
Crates is now deprecated and will no longer receive updates or bug fixes. However, Dependi will be continuously updated to ensure you always have the best tools at your disposal.

Why Migrate to Dependi?

- Continuous Updates: Unlike Crates, which will no longer be updated, Dependi will receive regular updates and improvements.

- Broad Language Support: In addition to Rust, Dependi now supports Go, JavaScript, and Python.

- Enhanced Security: Keep your projects safer with advanced security reports.
- Seamless Updates: Effortlessly manage all your dependency updates with a single command.

- Comprehensive Documentation: Access extensive documentation for Rust, Go, JavaScript, and Python.

Dependi Versions:

- Core Version: Dependi Core offers an extended feature set including the all feature set of Crates and it will be free always.

- Pro Version: For a limited time, enjoy a free trial period of our advanced version, which includes many new and powerful features.

Discover Dependi now and take advantage of its powerful features by [clicking here](https://www.dependi.io/) to join the next generation of dependency management!

Thank you for your loyalty and support to Crates. With Dependi, stronger and more efficient projects await you!

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

Help us simplify Rust dependency management with Crates, and let's make coding in Rust even more enjoyable! Together, we can achieve great things.
