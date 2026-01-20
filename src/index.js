/**
 * @typedef {Object} ModernFlowScrollInstance
 * @property {() => void} destroy Removes the message listener.
 */

/**
 * @typedef {Object} ModernFlowScrollOptions
 * @property {string} [iframeId="SpektrixIFrame"] The id of the main Spektrix <iframe> element.
 * @property {string} [domain=""] Your Spektrix custom domain (e.g. "tickets.example.org").
 *   Always allows *.spektrix.com too.
 *
 * @property {string} [navSelector=""] CSS selector for a fixed header/nav element. If set, the
 *   scroll will be offset by its height.
 * @property {number|(() => number)|null} [navHeight=null] Fixed nav height (pixels) or a callback
 *   returning an int. Takes priority over navSelector.
 *
 * @property {"auto"|"smooth"} [scrollBehavior="auto"] Scroll behavior (e.g. "smooth".
 * @property {"iframe"|"page"} [navigateScrollTarget="page"] After navigation, scroll to the top
 *   of the `iframe` (default) or top of the parent `page`.
 * @property {string[]} [expressCheckoutAllowlist=[]] When in the express checkout, perform a normal
 *   navigation scroll if the path ends with one of these suffixes.
 *
 * @property {boolean} [debug=false] Log scroll calculations to the console.
 */
const defaultOptions = {
  // Basic options
  iframeId: "SpektrixIFrame",
  domain: "",

  // Offset scrolls by a fixed-position nav bar
  navSelector: '',
  navHeight: null,

  // Scroll behavior settings
  scrollBehavior: "auto",
  navigateScrollTarget: "page",
  expressCheckoutAllowlist: ['startcheckoutlogin', 'orderconfirmation'],

  // Misc
  debug: false,
};

/**
 * Check if a message came from a valid origin domain.
 */
const isAllowedOrigin = (origin, domain) => {
  let hostname;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  // Always allow Spektrix hosted domains
  if (hostname.endsWith(".spektrix.com")) return true;

  // Matches custom domain?
  return domain && hostname === domain;
};

/**
 * Standardise messages from Spektrix. They could be a string of JSON, or a real object already.
 */
const coerceMessageData = (data) => {
  if (data && typeof data === "object") return data;
  if (typeof data !== "string") return null;

  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Get the position of the top of an element.
 */
const getElementTop = (el) => el.getBoundingClientRect().top + window.scrollY;

/**
 * If we're offsetting for a fixed navigation bar, let's calculate its height. We check this for
 * every scroll in case its height is dynamic/responsive.
 */
const getEffectiveNavHeight = (options) => {
  // 1) Callback
  if (typeof options.navHeight === "function") {
    try {
      const value = Number(options.navHeight());
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  // 2) Fixed int
  if (Number.isFinite(options.navHeight)) return options.navHeight;

  // 3) Selector
  if (options.navSelector) {
    const el = document.querySelector(options.navSelector);
    if (el) return el.getBoundingClientRect().height;
  }

  return 0;
};

/**
 * Decides whether we jump to the top of the iframe/page on navigation.
 *
 * If we are in the Express Checkout, we generally shouldn't jump,as we're expecting a "flow scroll"
 * message. However, there are some exceptions where they send no message at all.
 */
const shouldJumpAfterNavigation = (path, allowlist) => {
  if (!path.includes("secure/checkout/v2/")) return true;

  const list = Array.isArray(allowlist) ? allowlist : [];
  if (list.length === 0) return false; // safest default: block if no allowlist provided

  return list.some(
    (suffix) => typeof suffix === "string" && suffix.length > 0 && path.endsWith(suffix)
  );
};

/**
 * Calculate where we're scrolling to, taking the fixed nav into account.
 */
const computeScrollTarget = (base, navHeight, extraOffset = 0) => {
  const rawTarget = base + extraOffset - navHeight;
  return Math.round(Math.max(0, rawTarget));
};

/**
 * Scroll the window, but only if the user is further down.
 */
const scrollTo = (options, targetTop, force=false) => {
  if (force || targetTop < window.scrollY) {
    window.scrollTo({ top: targetTop, left: 0, behavior: options.scrollBehavior });
  } else {
    debugLog(options, "Scrolling cancelled - the user is already higher up the page.");
  }
};

/**
 * Log a debug message.
 */
const debugLog = (options, reason, targetTop=null, details=null) => {
  if (!options.debug) return;

  if(targetTop !== null){
    console.log(`[ModernFlowScroll] Scrolling to ${targetTop} due to ${reason}. Details:`);
  } else {
    console.log(`[ModernFlowScroll] ${reason}`);
  }

  if(details) console.log(details);
};

/**
 * Listen for Spektrix postMessage events and scroll the host page.
 *
 * @param {ModernFlowScrollOptions} [userOptions]
 * @returns {ModernFlowScrollInstance}
 */
export function initModernFlowScroll(userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  debugLog(options, 'Initialised', null, options);

  const onMessage = (event) => {
    if (!isAllowedOrigin(event.origin, options.domain)) return;

    const data = coerceMessageData(event.data);
    if (!data) return;

    const iframe = document.getElementById(options.iframeId);
    if (!iframe) return;

    const navHeight = getEffectiveNavHeight(options);

    if (data.type === "spektrix:navigated") {
      // Navigation messages
      const path = typeof data.path === "string" ? data.path : "";

      if (path && shouldJumpAfterNavigation(path, options.expressCheckoutAllowlist)) {
        // Scroll to either the top of the page or the iframe top
        const baseTarget = options.navigateScrollTarget === "page" ? 0 : getElementTop(iframe);
        const finalTarget = computeScrollTarget(baseTarget, navHeight, 0);

        debugLog(options, "navigation message", finalTarget, { 
          path, baseTarget, navHeight, finalTarget
        });
        scrollTo(options, finalTarget);
      }
    } else {
      const requestedOffset = Number(data?.spektrixOffset);

      if (Number.isFinite(requestedOffset) && requestedOffset > 0) {
        const baseTarget = getElementTop(iframe);
        const finalTarget = computeScrollTarget(baseTarget, navHeight, requestedOffset);

        debugLog(options, "flow scroll message", finalTarget, {
          requestedOffset, baseTarget, navHeight, finalTarget
        });
        scrollTo(options, finalTarget, true);
      }
    }
  };

  window.addEventListener("message", onMessage);

  return {
    destroy() {
      window.removeEventListener("message", onMessage);
    },
  };
}

export const ModernFlowScroll = {
  init: initModernFlowScroll,
};

export const init = initModernFlowScroll;

export default ModernFlowScroll;
