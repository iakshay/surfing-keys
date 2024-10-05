import { openLink } from "./global"

const parseLocation = () => {
  const u = new URL(window.location.href)
  const q = u.searchParams.get("q")
  const p = u.pathname.split("/")
  const res = {
    type: "unknown",
    url: u,
    query: q,
  }
  if (u.hostname === "www.google.com") {
    if (p.length <= 1) {
      res.type = "home"
    } else if (p[1] === "search") {
      switch (u.searchParams.get("tbm")) {
        case "vid":
          res.type = "videos"
          break
        case "isch":
          res.type = "images"
          break
        case "nws":
          res.type = "news"
          break
        default:
          res.type = "web"
      }
    } else if (p[1] === "maps") {
      res.type = "maps"
      if (p[2] === "search" && p[3] !== undefined) {
        res.query = p[3] // eslint-disable-line prefer-destructuring
      } else if (p[2] !== undefined) {
        res.query = p[2] // eslint-disable-line prefer-destructuring
      }
    }
  }

  return res
}
// Google
const go = {
  ddg: () => {
    const g = parseLocation()

    const ddg = new URL("https://duckduckgo.com")
    if (g.query) {
      ddg.searchParams.set("q", g.query)
    }

    switch (g.type) {
      case "videos":
        ddg.searchParams.set("ia", "videos")
        ddg.searchParams.set("iax", "videos")
        break
      case "images":
        ddg.searchParams.set("ia", "images")
        ddg.searchParams.set("iax", "images")
        break
      case "news":
        ddg.searchParams.set("ia", "news")
        ddg.searchParams.set("iar", "news")
        break
      case "maps":
        ddg.searchParams.set("iaxm", "maps")
        break
      case "search":
      case "home":
      case "unknown":
      default:
        ddg.searchParams.set("ia", "web")
        break
    }

    openLink(ddg.href)
  },

  perplexity: () => {
    const g = parseLocation()

    const pp = new URL("https://www.perplexity.ai/search")
    if (g.query) {
      pp.searchParams.set("q", g.query)
    }

    openLink(pp.href)
  },
}

export default go
