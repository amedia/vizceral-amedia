FROM dr.api.no/amedia/alpine-node:latest

ENV APPNAME vizceral
ADD . /usr/src/app
WORKDIR /usr/src/app

RUN npm install && \
    npm run clean && \
    npm run copy:fonts && \
    npm run copy:json && \
    adduser -s /bin/bash -u 1000 -S $APPNAME && \
    chown -R $APPNAME . && \
    apk --update del python make expat gdbm sqlite-libs libbz2 libffi g++ gcc && \
    rm -rf /var/cache/apk/*

USER $APPNAME

ENV PORT 9693
EXPOSE $PORT

CMD [ "npm", "run", "dev-server" ]
