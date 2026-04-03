module.exports = function (api) {
  const isProduction = api.env('production');

  return {
    presets: [
      'module:@react-native/babel-preset',
      'nativewind/babel',
    ],
    plugins: [
      ...(isProduction ? ['transform-remove-console'] : []),
      'react-native-reanimated/plugin',
    ],
  };
};
