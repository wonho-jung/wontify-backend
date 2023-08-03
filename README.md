# wontify-backend

## wontify(bacnked/database/API)

## how to dev

### install

```bash
yarn install
```

### set .env

MONGODB_URL = "Your MongoDB URL"
MONGODB_DB_NAME = "Your MongoDB Name"
MONGODB_COLLECTION_NAME = "Your MongoDB collection name"
MONGODB_SERVER_USER = "Your MongoDB server user"
MONGODB_SERVER_PASSWORD = "Your MongoDB server password"



### How to Start

- move to the functions directory
```bash
node api.js
```

### How to deploy on Netlify
- Check your package.json scripts to see if the build command is
```bash
"build": "netlify deploy --prod"
```
- Create netlify.toml on the root and follow copy/paste this into your netlify.toml.
```bash
[build] 
functions = "functions"
```
- Run build to trigger netlify build 
```bash
yarn run build
```


