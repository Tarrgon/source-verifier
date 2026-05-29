import dotenv from 'dotenv';

dotenv.config();

const {
  PORT, SECURE, PRIVATE_KEY_LOCATION, CERTIFICATE_LOCATION, CHAIN_LOCATION, MONGO_DB_URL,
  MONGO_DB_NAME, CHROME_EXECUTABLE_LOCATION, BLUESKY_USERNAME, BLUESKY_PASSWORD, INKBUNNY_USERNAME,
  INKBUNNY_PASSWORD, REDDIT_COOKIE, WEASYL_API_KEY, PIXIV_REFRESH_TOKEN
} = process.env;

export const config = {
  PORT: parseInt(PORT as string),
  SECURE: SECURE == 'true',
  USER_AGENT: 'Janitor Source Verifier/2.0 (by Tarrgon)',
  PRIVATE_KEY_LOCATION,
  CERTIFICATE_LOCATION,
  CHAIN_LOCATION,
  MONGO_DB_URL,
  MONGO_DB_NAME,
  CHROME_EXECUTABLE_LOCATION,
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