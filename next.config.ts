import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
});
