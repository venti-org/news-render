# news-render

## build

```sh
npm insntall -g yarn

yarn
```

## server

### dev

```bash
yarn dev
```

### release

```bash
yarn build
yarn start
```

## test

```bash
curl http://localhost:3000/render?url=https://baidu.com&enable_js=true
```

## generate parser render html code

```bash
yarn gen cpp
yarn gen rust
```

