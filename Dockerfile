FROM node:19-buster-slim
RUN apt-get update && apt-get install -yq git jq
COPY . /iris-messenger
WORKDIR /iris-messenger/
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN yarn
RUN yarn build
RUN cat package.json | jq '.scripts.serve="sirv build --host 0.0.0.0 --port 8080 --cors --single"' > package.json.new && mv -vf package.json.new package.json

CMD [ "yarn", "serve" ]

