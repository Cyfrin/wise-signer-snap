import type { SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

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
};

export default config;
