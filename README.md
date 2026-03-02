# alatere

## Prerequisites

- pnpm
- node 22

## Run Server

Create `apps/server/.env.local`, use `apps/server/.env.example` as a reference.

```console
$ cd apps/server
$ pnpm install
$ pnpm run dev
```

### Postman collection

Import `apps/server/postman_collection.json` to Postman.

### Useful scripts

Create `apps/server/.env.script` with needed environment variables, e.g. database connection url.

**Create user activation code**

```console
$ pnpm run exec:script ./dist/src/scripts/user/create-activation-code.js
```

**Create users**

```console
$ pnpm run exec:script ./dist/src/scripts/user/create-user.js
```

**Create partitions**

```console
$ pnpm run exec:script ./dist/src/scripts/db/create-chat-message-partitions.js
```

## Run client

TODO

## Deploy

TODO
