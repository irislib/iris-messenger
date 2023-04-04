FROM node:19-buster-slim
RUN apt-get update && apt-get install -yq git jq python3 build-essential
COPY . /iris-messenger
WORKDIR /iris-messenger/

RUN yarn && yarn build
RUN cat package.json | jq '.scripts.serve="sirv build --host 0.0.0.0 --port 8080 --cors --single"' > package.json.new && mv -vf package.json.new package.json

CMD [ "yarn", "serve" ]
