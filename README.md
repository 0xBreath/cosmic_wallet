

### Start Browser App (not extension)
```shell
yarn start:app
```


.

.


### Upload Development Chrome Extension
1. 
Run `yarn build:ext`

The build outputs to `dist` folder, which is the webpacked Javscript.

2. 
Go to `Manage Extensions` in chrome browser

3. 
Turn on `Developer Mode`

4. 
Click `Load unpacked` and upload the `dist` folder


.

.


### Upload Production Chrome Extension
TODO
Must be manifest V3
I think it's a zip of the `dist` that is published to chrome web store