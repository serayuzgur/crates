# Change Log
All notable changes to the "crates" extension will be documented in this file.

## 0.3.0
* This is the most complete release so far.
* Retry command added for reloading versions
* RegExps removed and migrated to a custom parser.  [#17](https://github.com/serayuzgur/crates/issues/17).
* Additional depencency case added for the test. [#22](https://github.com/serayuzgur/crates/issues/22).
* All failed fetchs will be reported via status mesage and notification with a *retry* command [#23](https://github.com/serayuzgur/crates/issues/23).
* A bug at caching fixed.
* Thanks to [@userzimmermann](https://github.com/userzimmermann) for this release.

## 0.2.4
* Regexp bug fixed by [@userzimmermann](https://github.com/userzimmermann)

## 0.2.3
* Extension listener is back to onchange but with a dirty control [#15](https://github.com/serayuzgur/crates/issues/15).
* Out of line dependencies supported. [#8](https://github.com/serayuzgur/crates/issues/8).
* No dependency case handled by [@userzimmermann](https://github.com/userzimmermann)

## 0.2.2
* "-" is the controlidentifier for pre-release check.
* crates now decorates the toml file on each save. Not on every change.
* Invalid toml files caused a glitch on version decorations. Now all will be cleared with a toolbar and error message. Also commented sections handled correctly. [#9](https://github.com/serayuzgur/crates/issues/9)

### 0.2.1
* Patreon link changed to a badge.
* Marketplace badges are linked to marketplace. [#13](https://github.com/serayuzgur/crates/issues/13).
* Package json improved.
* The up to date decorator (👍) is now customizable from setting crates.upToDateDecorator [#12](https://github.com/serayuzgur/crates/issues/12).
* Listing pre-releases is now customizable from setting crates.listPreReleases [#10](https://github.com/serayuzgur/crates/issues/10).


### 0.2.0
* Version resolution support improved [#6](https://github.com/serayuzgur/crates/issues/6).
* Yanked versions removed from the version list [#7](https://github.com/serayuzgur/crates/issues/7).

### 0.1.1
* build-dependencies support.
* dev-dependencies support.

### 0.1.0 
* Dependencies updated.
* Readme Updated.
* Version updated due to increased stability.

### 0.0.12 
* Version List error fixed [#4](https://github.com/serayuzgur/crates/issues/4).

### 0.0.11 
* Null control fix for "target". Thanks to [braunse](https://github.com/braunse).

### 0.0.10 
* Complex Cargo.toml error fixed. [#1](https://github.com/serayuzgur/crates/issues/1)
* Support for target dependencies. (not all usage cases)
* Re-decorates on edit. (It was on save before)

### 0.0.9 
* Version list (hover) is clickable now. Easier to navigate between versions.

### 0.0.8
* Better activation event. Listens for "Cargo.toml" as a rool level file.
* Refreshes after each save.
* fetch caching for performance

### 0.0.7
* If latest version is same with the current, a nice 👍 for you. No more unnecessary info.
* Hover tooltip is more readable now.
* Better gif at readme

### 0.0.6
* Activates on rust or toml.
* Only listens for Cargo.toml file

### 0.0.5 
* Last version bug fixed

### 0.0.4 
* travis integration
* gif resized
* readme edited
* badges added for marketplace and travis.
* parsing fixed for 

### 0.0.3
* Console errors fixed.

### 0.0.2
* Logo added

### 0.0.1
* The first release, an alpha.