# crap-app

Creates a React app w/ [TypeScript](https://www.typescriptlang.org/), [emotion](https://github.com/emotion-js/emotion), [Webpack 4](https://webpack.js.org/) + [hot-loading](https://github.com/gaearon/react-hot-loader). 

Unlike [CRA](https://github.com/facebook/create-react-app) (which is great BTW), this app will be immediately "ejected", i.e., after your project is created, you're on your own.

## Unmaintained

Use [Vite](https://vite.dev) instead:

```sh
bun create vite my-app --template react-ts
```

## Installation

```sh
sudo npm i -g crap-app
```

Or just use [npx](https://www.npmjs.com/package/npx) or [yarn dlx](https://next.yarnpkg.com/cli/dlx).

# Usage

```sh
[npx] crap-app
```

Starts the wizard. It'll ask you a few simple questions and then create a fully functional app for you.

It looks like this:

![](https://s3.amazonaws.com/uploads.hipchat.com/130443/945927/OrtPlKJmpVJXjjF/upload.png)

I tried to keep the output as simple as possible so that you can easily add new webpack loaders and reconfigure it however you please.

`cd` into your app directory and run `make start` to startup a development server, or `make build` to create a production build. At the moment, the output is fully static -- i.e., you only need a simple HTTP server to run your app like Nginx or Github Pages (no [Express](https://expressjs.com/)/Node server required).

I like to use [GNU Make](https://www.gnu.org/software/make/) instead of npm scripts because there's no requirement for the `node_modules` to be installed first, it keeps the build process consistent across apps (Node or otherwise), and it usually comes preinstalled on linux.

# Credit

`@` syntax and `<ScrollTop>` "borrowed" from Lee Benson's [ReactQL](https://github.com/leebenson/reactql).

[create-react-app](https://github.com/facebook/create-react-app) for other ideas.
