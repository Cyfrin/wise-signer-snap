import type { SnapConfig } from '@metamask/snaps-cli';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.tsx'),
  server: {
    port: 8080,
  },
  polyfills: {
    buffer: true,
    crypto: true,
    stream: true,
    assert: true,
    http: true,
    https: true,
    os: true,
    url: true,
    util: true,
    string_decoder: true,
    events: true,
  },
  environment: {
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  },
};

export default config;
