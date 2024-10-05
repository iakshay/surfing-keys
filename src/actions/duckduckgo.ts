import { openLink } from "./global"
// DuckDuckGo
const dg = {
  parseLocation: () => {
    let u
    try {
      u = new URL(window.location.href)
    } catch (e) {
      return
    }

    const q = u.searchParams.get("q")

    const res = {
      type: "unknown",
      url: u,
      query: q,
    }

    const iax = u.searchParams.get("iax")
    const iaxm = u.searchParams.get("iaxm")
    const iar = u.searchParams.get("iar")

    if (iax === "images") {
      res.type = "images"
    } else if (iax === "videos") {
      res.type = "videos"
    } else if (iar === "news") {
      res.type = "news"
    } else if (iaxm === "maps") {
      res.type = "maps"
    }
    return res
  },

  goog: () => {
    const c = dg.parseLocation()
    const goog = new URL("https://google.com/search")

    if (c.query) {
      goog.searchParams.set("q", c.query)
    }

    if (c.type === "images") {
      goog.searchParams.set("tbm", "isch")
    } else if (c.type === "videos") {
      goog.searchParams.set("tbm", "vid")
    } else if (c.type === "news") {
      goog.searchParams.set("tbm", "nws")
    } else if (c.type === "maps") {
      goog.pathname = "/maps"
    }

    openLink(goog.href)
  },

  perplexity: () => {
    const c = dg.parseLocation()
    const pp = new URL("https://www.perplexity.ai/search")
    if (c.query) {
      pp.searchParams.set("q", c.query)
    }

    openLink(pp.href)
  },

  siteSearch: (site) => {
    let u
    try {
      u = new URL(window.location.href)
    } catch (e) {
      return
    }

    const siteParam = `site:${site}`

    const q = u.searchParams.get("q")
    if (!q) {
      return
    }

    const i = q.indexOf(siteParam)
    if (i !== -1) {
      u.searchParams.set("q", q.replace(siteParam, ""))
    } else {
      u.searchParams.set("q", `${q} ${siteParam}`)
    }

    openLink(u.href)
  },
}

export default dg