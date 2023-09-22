# Stage: base image
FROM node:18.18-bullseye-slim as base

ARG BUILD_NUMBER=2023-05-18.1.39b1b24
ARG GIT_REF=unknown
ARG GIT_BRANCH=unknown

LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

WORKDIR /app

# Cache breaking
ENV BUILD_NUMBER=${BUILD_NUMBER:-2023-05-18.1.39b1b24}
ENV GIT_REF=${GIT_REF:-unknown}
ENV GIT_BRANCH=${GIT_BRANCH}

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Stage: build assets
FROM base as build

ARG BUILD_NUMBER=2023-05-18.1.39b1b24
ARG GIT_REF=unknown
ARG GIT_BRANCH=unknown

ENV GIT_BRANCH=${GIT_BRANCH}

RUN apt-get update && \
    apt-get install -y make python g++

COPY package*.json ./
RUN CYPRESS_INSTALL_BINARY=0 npm ci --no-audit

COPY . .
RUN npm run build

RUN npm prune --no-audit --omit=dev

# Stage: copy production assets and dependencies
FROM base

COPY --from=build --chown=appuser:appgroup \
        /app/package.json \
        /app/package-lock.json \
        ./

COPY --from=build --chown=appuser:appgroup \
        /app/assets ./assets

COPY --from=build --chown=appuser:appgroup \
        /app/dist ./dist

COPY --from=build --chown=appuser:appgroup \
        /app/node_modules ./node_modules

EXPOSE 3000 3001
ENV NODE_ENV='production'
USER 2000

CMD [ "npm", "start" ]
