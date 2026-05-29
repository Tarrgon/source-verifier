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