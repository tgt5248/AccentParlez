module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'], // 'module:metro-react-native-babel-preset' 제거
        plugins: [
            ['module:react-native-dotenv', {
                moduleName: '@env',
                path: '.env',
                blocklist: null,
                allowlist: null,
                safe: false,
                allowUndefined: true,
            }],
        ],
    };
};
