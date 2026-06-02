# FlareSolverr
Requires https://github.com/sykezz/FlareSolverr running on the `download` branch to be running and open on port 8191. This may change if/when the main project merges the PR from this branch. 

```bash
git clone https://github.com/sykezz/FlareSolverr && cd FlareSolverr
git checkout download
docker build --tag 'flaresolverr' .
docker run --detach -p 8191:8191 flaresolverr
```

# Pixiv
Pixiv must be initialized with its first refresh token as this cannot be automated. I recommend using https://gist.github.com/ZipFile/c9ebedb224406f4f11845ab700124362. Paste the refresh token into your `.env` file after `PIXIV_REFRESH_TOKEN=` and leave it there. Once it's used the first time, the database will store the new refresh token, if it changse.

If you leave this offline for too long, the refresh token might die. In which case, you will need to manually remove the token from the database and redo the above steps, replacing the old token.

Manually removing the token:
```bash
mongosh
use sourceVerifierServer
db.tokens.deleteOne({_id: 'pixiv'})
```

After running the above commands, exit the mongo shell, initialize a new refresh token, and restart the server.

# Reddit
Login to reddit on your favorite browser. Use a cookie exporter extension to get the cookies. Remove the `g_state` cookie as this contains quotes which breaks yml stuff, and it's not needed anyways. You could likely remove a lot of the additional cookies as well, but I find the most success in leaving all of them. This may need to be refreshed at some point, but I'm not sure when. Not all reddit posts require authentication, this is mainly to bypass bot detection.

# Puppet
Some sites need to use a puppet browser to bypass some adult content restrictions. Depending on your OS and many other factors, you may need to manually tell puppet where chrome is. You can do so with the `CHROME_EXECUTABLE_LOCATION` variable in `.env`. But, you might not need anything there, either. It all depends on your setup

# Docker
Oh, docker. Fuck you. I hate you docker. Alright. This thing has a working docker compose workflow. Building and running is as simple as:
```bash
docker compose build
docker compose up -d
```

However, some things you need to setup first. You have to ensure your `MONGO_DB_URL` in `.env` points to the correct location. Whether this is a docker hosted named mongo instance container name, or a mongo url using the host container name: `host.docker.internal`. For me, since I run docker as a service and not containerized, I would use `MONGO_DB_URL="mongodb://host.docker.internal:27017"`, however your URL may very well be different.

FlareSolverr runs in its own docker container and must be running for this to work. I find success by setting my URL to `FLARE_SOLVERR_URL='http://host.docker.internal:8191'`, however there may be a smarter way since FlareSolverr is itself a container and can likely be used directly without going through the host interface.

SSL, fucking SSL. This is annoying. Right now it works by mounting your `KEY_LOCATIONS` to `/app/keys` in the container, and your `PRIVATE_KEY_LOCATION`, `CERTIFICATE_LOCATION`, and `CHAIN_LOCATION` should all have the base path `/app/keys` before continuing to the relative path of each file. **IMPORTANT:** You must make sure docker has permissions to these files. Since I hate linux permissions, I just used `chmod 755 -R /etc/letsencrypt/live` to allow all users access to read the files, however, on a system that requires more security this may not be ideal. I'm not a permissions expert and users and usergroups are annoying to work with, but you may need to set the UID and GID of the docker container and manually give the group/user read access to the files and it should work fine. My current `.env` in this regard looks like this:
```bash
KEY_LOCATIONS="/etc/letsencrypt/"
PRIVATE_KEY_LOCATION="/app/keys/live/tarrgon.gay/privkey.pem"
CERTIFICATE_LOCATION="/app/keys/live/tarrgon.gay/cert.pem"
CHAIN_LOCATION="/app/keys/live/tarrgon.gay/chain.pem"
```

The docker build automatically downloads chromium for you, you will need to set `CHROME_EXECUTABLE_LOCATION="/usr/bin/chromium-browser"` in your `.env` file for it to work properly.