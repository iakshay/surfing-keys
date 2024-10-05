// Site/Page Information
// ---------------------

const ddossierUrl = "http://centralops.net/co/DomainDossier.aspx"

export const getWhoisUrl = ({ hostname = window.location.hostname } = {}) =>
  `${ddossierUrl}?dom_whois=true&addr=${hostname}`

export const getDnsInfoUrl = ({
  hostname = window.location.hostname,
  all = false,
} = {}) =>
  `${ddossierUrl}?dom_dns=true&addr=${hostname}${
    all
      ? "?dom_whois=true&dom_dns=true&traceroute=true&net_whois=true&svc_scan=true"
      : ""
  }`

export const getGoogleCacheUrl = ({ href = window.location.href } = {}) =>
  `https://webcache.googleusercontent.com/search?q=cache:${href}`

export const getWaybackUrl = ({ href = window.location.href } = {}) =>
  `https://web.archive.org/web/*/${href}`

export const getOutlineUrl = ({ href = window.location.href } = {}) =>
  `https://outline.com/${href}`

export const getAlexaUrl = ({ hostname = window.location.hostname } = {}) =>
  `https://www.alexa.com/siteinfo/${hostname}`

export const getBuiltWithUrl = ({ href = window.location.href } = {}) =>
  `https://www.builtwith.com/?${href}`

export const getWappalyzerUrl = ({
  hostname = window.location.hostname,
} = {}) => `https://www.wappalyzer.com/lookup/${hostname}`

export const getDiscussionsUrl = ({ href = window.location.href } = {}) =>
  `https://discussions.xojoc.pw/?${new URLSearchParams({ url: href })}`

export const getSummaryUrl = ({ href = window.location.href } = {}) =>
  `https://kagi.com/summarizer/index.html?${new URLSearchParams({
    url: href,
  })}`