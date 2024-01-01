<p align="center">
  <a href="https://cosmicwallet.io">
    <img alt="Cosmic Wallet" src="./public/favicon/logo192.png" style="border-radius: 50%"/>
  </a>
</p>

[//]: # (# Cosmic Wallet)

<h1 style="color: #b68f55"> Cosmic Wallet </h1>

This functions as a browser extension and a web app.

.

.


<h3 style="color: #6495ac"> Start Web App </h3>

```shell
yarn && yarn start
```

.

.


<h3 style="color: #6495ac"> Upload Chrome Extension - Development </h3>

1.

Run `yarn build`

The build outputs to `dist` folder, which is the webpacked Javscript.

2.

Go to `Manage Extensions` in chrome browser

3.

Turn on `Developer Mode`

4.

Click `Load unpacked` and upload the `dist` folder

.

.


<h3 style="color: #6495ac"> Upload Chrome Extension - Production </h3>

TODO
Must be manifest V3
I think it's a zip of the `dist` that is published to chrome web store

.

.


<h3 style="color: yellow"> TODO </h3>

- [ ] Popup to sign transaction
- [ ] Impl player profile logic in `CosmicWallet`
- [ ] Impl create profile and keys logic, UI to setup trx, popup to sign transaction
- [ ] Impl sign trx with profile key, UI to setup, popup to sign transaction
- [ ] Explorer - to not leave the app to analyze the chain
- [ ] Jupiter API for advanced trading features - to not leave the app to trade
- [ ] Covesting - to not leave the app to earn high yield at a low risk
- [ ] ZK