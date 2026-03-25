/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination:
                    process.env.NODE_ENV === "development"
                        ? "http://localhost:5001/api/:path*"
                        : "/api/:path*", // in prod, handled by Vercel/serverless
            },
        ];
    },
};
