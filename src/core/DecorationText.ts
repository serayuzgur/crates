
import { DecorationInstanceRenderOptions } from "vscode"

/**
 * DecorationText is a data structure that binds the decoration text to its configured css
 */
export default interface DecorationPreferences {
    compatibleDecoratorCss: DecorationInstanceRenderOptions,
    incompatibleDecoratorCss: DecorationInstanceRenderOptions,
    errorDecoratorCss: DecorationInstanceRenderOptions
}
