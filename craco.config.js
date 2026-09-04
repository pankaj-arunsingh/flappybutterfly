module.exports = {
    babel: {
        plugins: [
            [
                'react-magnetic-di/babel-plugin',
                {
                    exclude: ['mocks', /test\.[jt]sx?$/, /setupTests/],
                    // Only instrument in test: app runs without di() wrappers
                    // in development/production, avoiding runtime overhead
                    // and any dev-server interaction with the plugin.
                    enabledEnvs: ['test'],
                },
            ],
        ],
    },
};
