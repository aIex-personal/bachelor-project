FROM alpine:3.20

ARG PB_VERSION=0.36.9

RUN apk add --no-cache ca-certificates wget unzip && \
    wget -O /tmp/pocketbase.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" && \
    unzip /tmp/pocketbase.zip pocketbase -d /pb/ && \
    rm /tmp/pocketbase.zip && \
    chmod +x /pb/pocketbase

WORKDIR /pb

COPY pb_migrations ./pb_migrations

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", \
     "--http=0.0.0.0:8090", \
     "--migrationsDir=./pb_migrations", \
     "--dir=./pb_data"]
