# Modern Flow Scroll for Spektrix

A modern, unofficial alternative to [Spektrix's Flow Scroll script](https://integrate.spektrix.com/docs/expresscheckoutflow#flow-scroll).

Scrolls the parent page to the relevant part of the Spektrix iframe as you navigate the Express Checkout.

It can also cleanly replace the ["onload" approach](https://integrate.spektrix.com/docs/resizingiframes#scroll) often used for jumping to the top of the other, classic iframes (see the configuration section below).

## Features

This package offers the following advantages:

- Works with **Spektrix custom domains** out of the box.
- Works with the **express checkout** ("flow scroll"), the **classic checkout** and [the other iframe pages](https://integrate.spektrix.com/docs/standardbookingflow) too, without a messy mix of scripts and onload attributes.
- Can accommodate a **fixed-position navigation bar** (or other elements that overlay the viewport) with one-line configuration.

## Prerequisites
You'll need Spektrix's [Resize Script](https://integrate.spektrix.com/docs/resizingiframes) already installed and working.

## Installation

### Modern JS build processes
```sh
npm i modern-flow-scroll-for-spektrix
```
Then in your app's JS:

```js
import ModernFlowScroll from "modern-flow-scroll-for-spektrix";

ModernFlowScroll.init({
  domain: "tickets.example.org",     // Your Spektrix custom domain
  navSelector: "#navigation-header", // Optional position:fixed nav element
  debug: false,                      // Remove this once you're happy
  scrollBehavior: "auto"             // e.g. "smooth"
});
```

See below for all possible configuration parameters.

### Simple script tag

Install with `npm i modern-flow-scroll-for-spektrix` and copy `dist/modern-flow-scroll.min.js` as part of your build process. Or just grab the script from the [releases page](https://github.com/oh-digital/modern-flow-scroll-for-spektrix/releases).

Then add the following to your page:

```html
<script src="/path/to/modern-flow-scroll.min.js"></script>
<script>
  ModernFlowScroll.init({
    domain: "tickets.example.org", // Your Spektrix custom domain
    // ...
  });
</script>
```

Edit the src path and domain as appropriate for your project. See below for all possible configuration parameters.

## Configuration

### Immitating the Spektrix "onload" jump

This script can also replace [Spektrix's "onload" approach](https://integrate.spektrix.com/docs/resizingiframes#scroll), for jumping to the top of the page on iframe navigation.

1) Open your Spektrix *Website Admin* interface (*websiteadmininterfacepage.aspx*)
2) Choose the relevant domain from the list in *Domain specific config* and add the below snippet to the *Specify HTML Headers* field.

```html
<script>window.addEventListener("DOMContentLoaded", () => {try {window.parent.postMessage({ type: "spektrix:navigated", path: location.pathname }, "*");} catch (e) {}});</script>
```

Now, in addition to the preexisting Express Checkout *flow scroll* behaviour, the other iframes will jump to the top, after navigation. This includes some Express checkout frames that aren't covered by *flow scroll*, such as the order confirmation page.

#### Changing the jump behaviour
You can choose whether to jump to the top of the page, or the top of the iframe itself, with an extra config option:

```js
ModernFlowScroll.init({
  navigateScrollTarget: "page" // "page" or "iframe"
});
```

### Accounting for a fixed-position navigation bar

If you have a fixed or "sticky" nav bar that overlays the site, you'll want to offset any scrolls so that iframe starts just *below* the nav bar, not under it.

Just supply a CSS selector that targets your nav bar. If it's responsive and changes height, that'll be taken into account.

```js
ModernFlowScroll.init({
  navSelector: "#header .sticky-navigation", // Any CSS selector
});
```

Or you can calculate the offset yourself, if it's more complicated:

```js
ModernFlowScroll.init({
  // Callback. This will be called for every jump, in case the height is dynamic.
  navHeight: () => document.querySelector("header")?.offsetHeight + 32,
  // OR, just a number of pixels:
  navHeight: 105,
});
```

### All configuration parameters

All configuration parameters are optional. However, the script won't work if you're using a custom Spektrix domain unless `domain` is properly configured.

| Option | Default |Description |
| --- | --- | --- |
| iframeId | `"SpektrixIFrame"` | The id of your Spektrix iframe. |
| domain | `""` | Your Spektrix custom domain, e.g. `"tickets.example.org"`. `*.spektrix.com` is accepted automatically too, so you can omit this if you're not using a custom domain. |
| navSelector | `""` | CSS selector of your sticky nav bar. It's height will offset any scroll positions to accommodate. Only works if `navHeight` is not set. |
| navHeight | `null` | Fixed nav height (pixels) or a callback returning an int. Takes priority over navSelector. |
| scrollBehavior | `false` | Override scroll behavior, e.g. `"smooth"`. |
| navigateScrollTarget | `"page"` | Whether to scroll to the top of the `"iframe"` or the top of the parent `"page"` after navigation. |
| alwaysScroll | `false` | Always scroll the viewport on navigation, even if the user is already further up the page. Only useful when `navigateScrollTarget` is `"iframe"` and you always want forced scrolling. Not recommended.
| debug | `false` | Set to true if you want useful debug info logged to the console. |

## License

Licensed under the Mozilla Public License 2.0 (MPL-2.0). Modifications to files in this project must be made available under MPL when distributed.

This project is not affiliated with or endorsed by Spektrix.
