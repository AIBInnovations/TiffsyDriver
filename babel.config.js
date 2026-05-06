module.exports = function (api) {
  const isProduction = api.env('production');

  return {
    presets: [
      'module:@react-native/babel-preset',
      'nativewind/babel',
    ],
    plugins: [
      ...(isProduction ? ['transform-remove-console'] : []),
      // Reanimated 4 + worklets 0.7+ use the worklets package's plugin directly.
      // Using the old 'react-native-reanimated/plugin' here ships an outdated
      // worklets transformer that mismatches the runtime and red-screens the app.
      'react-native-worklets/plugin',
    ],
  };
};
