import type { NextConfig } from "next";

const config: NextConfig = {
  // pg is a Node-only package; keep it out of the client bundle.
  serverExternalPackages: ["pg"],
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hotsname: 'thumb.wikimedia.org',
        port: '',
        pathname: '/wikipedia/commons/thumb/7/70/Shark_Tank_TV_logo.svg/3840px-Shark_Tank_TV_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail',
      },
    ],
  },
}

export default config;
