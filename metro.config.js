// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { resolve } = require("metro-resolver");
const { withNativewind } = require("nativewind/metro");
 
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const clerkExpoRoot = path.join(__dirname, "node_modules", "@clerk", "expo", "dist");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@clerk-fixed/provider") {
    return {
      filePath: path.join(clerkExpoRoot, "provider", "ClerkProvider.js"),
      type: "sourceFile",
    };
  }

  if (moduleName === "@clerk-fixed/useAuth") {
    return {
      filePath: path.join(clerkExpoRoot, "hooks", "useAuth.js"),
      type: "sourceFile",
    };
  }

  if (moduleName === "@clerk-fixed/useSSO") {
    return {
      filePath: path.join(clerkExpoRoot, "hooks", "useSSO.js"),
      type: "sourceFile",
    };
  }

  if (moduleName === "@clerk-fixed/react") {
    return {
      filePath: path.join(
        __dirname,
        "node_modules",
        "@clerk",
        "expo",
        "node_modules",
        "@clerk",
        "react",
        "dist",
        "index.js",
      ),
      type: "sourceFile",
    };
  }

  if (
    moduleName === "./singleton" &&
    context.originModulePath ===
      path.join(clerkExpoRoot, "provider", "ClerkProvider.js")
  ) {
    return {
      filePath: path.join(clerkExpoRoot, "provider", "singleton", "singleton.js"),
      type: "sourceFile",
    };
  }

  if (
    moduleName === "../provider/singleton" &&
    (context.originModulePath ===
      path.join(clerkExpoRoot, "native", "AuthView.js") ||
      context.originModulePath ===
        path.join(clerkExpoRoot, "native", "InlineAuthView.js"))
  ) {
    return {
      filePath: path.join(clerkExpoRoot, "provider", "singleton", "singleton.js"),
      type: "sourceFile",
    };
  }

  if (
    moduleName === "./provider/singleton" &&
    context.originModulePath === path.join(clerkExpoRoot, "index.js")
  ) {
    return {
      filePath: path.join(clerkExpoRoot, "provider", "singleton", "singleton.js"),
      type: "sourceFile",
    };
  }

  return resolve(context, moduleName, platform);
};
 
module.exports = withNativewind(config);
