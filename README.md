# wReader (Chrome App)

wReader is a simple web feed reader implemented as a Chrome Platform app using [AngularJS](http://angularjs.org/).

![wReader screenshot](https://raw.github.com/GoogleChrome/wReader-app/master/docs/wReader.png)


## Installation

1. Clone this repo
2. Download Chrome Canary and Start
3. Open <chrome://flags> and enable `Experimental Extension APIs`
4. Relaunch the browser
5. Open <chrome://chrome/extensions/>
6. Check `Developer Mode`
7. Click on `Load unpacked extension...` and select the root of this projects directory
8. Open new tab and click on `wReader` icon


## Architecture

![wReader Architecture Diagram](https://raw.github.com/GoogleChrome/wReader-app/master/docs/wReader-arch.png)

## Technologies Used

- [Chrome App Platform](http://developer.chrome.com/trunk/apps/about_apps.html)
  - [`chrome.experimental.app`](http://developer.chrome.com/trunk/apps/app_lifecycle.html)
  - [`chrome.storage.sync`](http://code.google.com/chrome/extensions/dev/storage.html)
  - [`chrome.storage.local`](http://code.google.com/chrome/extensions/dev/storage.html)
  - [`chrome.alarms`](http://code.google.com/chrome/extensions/dev/alarms.html)
  - [`sandboxed pages`](http://code.google.com/chrome/extensions/dev/manifest.html#sandbox)
- [AngularJS](http://angularjs.org/)
- [Twitter Bootstrap](http://twitter.github.com/bootstrap/)

