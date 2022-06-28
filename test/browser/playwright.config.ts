import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    forbidOnly: !!process.env.CI,
    globalTimeout: process.env.CI ? 30 * 60 * 1000 : undefined,
    workers: process.env.CI ? 2 : undefined,
    use: {
        trace: 'retain-on-failure',
        screenshot: process.env.CI ? 'only-on-failure' : 'on'
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']}
        },
        {
            name: 'firefox',
            use: {...devices['Desktop Firefox']}
        },
        /*
        {
            name: 'webkit',
            use: {...devices['Desktop Safari']}
        }
        */
    ]
};

export default config;