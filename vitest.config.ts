import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        define: {
            'process.env.ETHEREUM_RPC_URL': JSON.stringify(
                env.ETHEREUM_RPC_URL,
            ),
            'process.env.POLYGON_RPC_URL': JSON.stringify(env.POLYGON_RPC_URL),
            'process.env.ARBITRUM_RPC_URL': JSON.stringify(
                env.ARBITRUM_RPC_URL,
            ),
            'process.env.FANTOM_RPC_URL': JSON.stringify(env.FANTOM_RPC_URL),
        },
        test: {
            testTimeout: 20_000,
            hookTimeout: 30_000,
            setupFiles: ['/test/vitest-setup.ts'],
            globals: true,
            // Uncomment to debug suite excluding some tests
            // exclude: ['test/*weighted*.integration.*', 'node_modules', 'dist'],
            // Uncomment to run integration tests sequentially
            // threads: false,
        },
    };
});
