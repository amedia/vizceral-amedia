FROM dr.api.no/amedia/alpine-node:latest

ENV APPNAME vizceral
WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm config set -g production false # Ensure devDependencies are installed
RUN npm install

COPY . /usr/src/app

RUN npm run build:client && \
    npm prune --production && \
    adduser -s /bin/bash -u 1000 -S $APPNAME && \
    chown -R $APPNAME . && \
    apk --update del python make expat gdbm sqlite-libs libbz2 libffi g++ gcc && \
    rm -rf /var/cache/apk/*

USER $APPNAME

ENV PORT 9693
EXPOSE $PORT

