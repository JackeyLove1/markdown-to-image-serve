```shell
docker build -t markdown-to-image-serve .
docker run -p 3000:3000 markdown-to-image-serve
```

```sh
# install nodejs
sudo apt update           # refresh package lists
sudo apt install -y nodejs npm
node -v && npm -v         # verify versions

# install chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb -y
which google-chrome-stable

# install pnpm
npm install -g pnpm
pnpm --version
pnpm i generic-pool

# package and run
pnpm build && pnpm start
```