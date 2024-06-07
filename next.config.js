/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"]
  }
};

const dotenvExpand = require('dotenv-expand');

dotenvExpand.expand({ parsed: {...process.env } });

module.exports = nextConfig;
