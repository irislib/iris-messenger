FROM ubuntu:22.04
RUN apt update -yq
RUN DEBIAN_FRONTEND=noninteractive apt install -yq aptitude emacs-nox screen rsync build-essential curl git jq
RUN DEBIAN_FRONTEND=noninteractive apt purge -yq cmdtest nodejs
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN DEBIAN_FRONTEND=noninteractive apt install -yq nodejs
RUN npm install --global yarn
COPY . iris-messenger
RUN (cd iris-messenger && yarn)
RUN (cd iris-messenger && NODE_OPTIONS=--openssl-legacy-provider yarn build)
RUN (cd iris-messenger && cat package.json | jq '.scripts.serve="sirv build --host 0.0.0.0 --port 8080 --cors --single"' > package.json.new && mv -vf package.json.new package.json)

CMD bash -c "(cd iris-messenger && NODE_OPTIONS=--openssl-legacy-provider yarn serve)"

