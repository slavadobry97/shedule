import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    customWorkerSrc: "worker",
    workboxOptions: {
        disableDevLogs: true,
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.watchOptions = {
            ...config.watchOptions,
            ignored: [
                ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
                "**/node_modules/**",
                "**/.git/**",
                "**/System Volume Information/**",
                "D:/System Volume Information",
            ],
        };
        return config;
    },
};


export default withPWA(nextConfig);

