import dotenv from 'dotenv';

dotenv.config();

const {
  PORT, SECURE, PRIVATE_KEY_LOCATION, CERTIFICATE_LOCATION, CHAIN_LOCATION, MONGO_DB_URL,
  MONGO_DB_NAME, BLUESKY_USERNAME, BLUESKY_PASSWORD, INKBUNNY_USERNAME, INKBUNNY_PASSWORD,
  REDDIT_COOKIE, WEASYL_API_KEY, PIXIV_REFRESH_TOKEN
} = process.env;

export const config = {
  PORT: parseInt(PORT as string),
  SECURE: SECURE == 'true',
  PRIVATE_KEY_LOCATION,
  CERTIFICATE_LOCATION,
  CHAIN_LOCATION,
  MONGO_DB_URL,
  MONGO_DB_NAME,
  BLUESKY_USERNAME,
  BLUESKY_PASSWORD,
  INKBUNNY_USERNAME,
  INKBUNNY_PASSWORD,
  REDDIT_COOKIE,
  WEASYL_API_KEY,
  PIXIV_REFRESH_TOKEN
};

for (const [key, val] of Object.entries(config)) {
  if (val === undefined) {
    throw new Error(`${key} is undefined in config`);
  }
}