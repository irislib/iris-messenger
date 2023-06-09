# Build Stage
FROM node:19-buster-slim AS build-stage

# Install tools
RUN apt-get update \
    && apt-get install -y git \
    && apt-get install -y jq \
    && apt-get install -y python3 \
    && apt-get install -y build-essential

# Create build directory
WORKDIR /build

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN yarn

# Copy project files and folders to the current working directory (i.e. '/app')
COPY . .

# Build app
RUN cat package.json | jq '.scripts.serve="sirv build --host 0.0.0.0 --port 8080 --cors --single"' > package.json.new && mv -vf package.json.new package.json
RUN yarn build

# Final image
FROM node:19-buster-slim

# Change directory to '/app' 
WORKDIR /app

# Copy built code from build stage to '/app' directory
COPY --from=build-stage /build .

EXPOSE 8080

CMD [ "yarn", "serve" ]
