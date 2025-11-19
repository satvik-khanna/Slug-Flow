const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.resolver.assetExts.push("ics");
  return config;
})();
