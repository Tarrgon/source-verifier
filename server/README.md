Requires https://github.com/sykezz/FlareSolverr running on the `download` branch to be running and open on port 8191

```bash
git clone https://github.com/sykezz/FlareSolverr && cd FlareSolverr
git checkout download
docker build --tag 'flaresolverr' .
docker run --detach -p 8191:8191 flaresolverr
```