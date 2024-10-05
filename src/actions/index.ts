import api from "../api"
import priv from "../conf.priv"
import util from "../util"
export { default as gh } from "./github"
export { default as dg } from "./duckduckgo"
export { default as go } from "./google"
export { default as yt } from "./youtube"
import * as global from "./global"

export * from "./site"
export * from "./global"
const { Front, Hints, Normal, RUNTIME, Clipboard } = api

// FakeSpot
// --------
export const fakeSpot = (url = window.location.href) =>
  global.openLink(`https://fakespot.com/analyze?ra=true&url=${url}`, {
    newTab: true,
    active: false,
  })

// Site-specific actions
// =====================

// Amazon
// -----
export const az = {
  viewProduct: () => {
    const reHost = /^([-\w]+[.])*amazon.\w+$/
    const rePath = /^(?:.*\/)*(?:dp|gp\/product)(?:\/(\w{10})).*/
    const elements = {}
    document.querySelectorAll("a[href]").forEach((a) => {
      const u = new URL(a.href)
      if (u.hash.length === 0 && reHost.test(u.hostname)) {
        const rePathRes = rePath.exec(u.pathname)
        if (rePathRes === null || rePathRes.length !== 2) {
          return
        }
        if (!util.isElementInViewport(a)) {
          return
        }

        const asin = rePathRes[1]

        if (elements[asin] !== undefined) {
          if (
            !(
              elements[asin].text.trim().length === 0 &&
              a.text.trim().length > 0
            )
          ) {
            return
          }
        }

        elements[asin] = a
      }
    })
    Hints.create(Object.values(elements), Hints.dispatchMouseClick)
  },
}

// Godoc
// -----
export const viewGodoc = () =>
  global.openLink(
    `https://godoc.org/${util.getURLPath({ count: 2, domain: true })}`,
    {
      newTab: true,
    }
  )

export const perplexity = {
  go: () => {
    const query = document.querySelector("h1")?.innerText

    const goog = new URL("https://google.com/search")

    if (query) {
      goog.searchParams.set("q", query)
    }

    global.openLink(goog.href)
  },
}

// GitLab
// ------
export const gl = {
  star: () => {
    const repo = window.location.pathname
      .slice(1)
      .split("/")
      .slice(0, 2)
      .join("/")
    const btn = document.querySelector(".btn.star-btn > span")
    btn.click()
    const action = `${btn.textContent.toLowerCase()}red`
    let star = "☆"
    if (action === "starred") {
      star = "★"
    }
    Front.showBanner(`${star} Repository ${repo} ${action}`)
  },
}

// Twitter
// ------
export const tw = {
  openUser: () =>
    util.createHints(
      [].concat(
        [
          ...document.querySelectorAll(
            "a[role='link'] img[src^='https://pbs.twimg.com/profile_images']"
          ),
        ].map((e) => e.closest("a")),
        [...document.querySelectorAll("a[role='link']")].filter((e) =>
          e.text.match(/^@/)
        )
      )
    ),
}

// Bsky
// ----
export const by = {
  copyDID: () => {
    util.createHints("img[src*='/did:plc:']", (e) => {
      const [_, did] = e.src.match("/(did:.*)/")
      if (did) Clipboard.write(did)
    })
  },

  copyPostID: () => {
    util.createHints('a[href*="/post/"]', (e) => {
      const [_, postID] = e.pathname.match(/^\/profile\/[^/]+\/post\/(\w+)/)
      if (postID) Clipboard.write(postID)
    })
  },
}

// Reddit
// ------
export const re = {
  collapseNextComment: () => {
    const vis = Array.from(
      document.querySelectorAll(".noncollapsed.comment")
    ).filter((e) => util.isElementInViewport(e))
    if (vis.length > 0) {
      vis[0].querySelector(".expand").click()
    }
  },
}

// Hacker News
// ----------
export const hn = {
  goParent: () => {
    const par = document.querySelector(".navs>a[href^='item']")
    if (!par) {
      return
    }
    global.openLink(par.href)
  },

  collapseNextComment: () => {
    const vis = Array.from(document.querySelectorAll("a.togg")).filter(
      (e) => e.innerText === "[–]" && util.isElementInViewport(e)
    )
    if (vis.length > 0) {
      vis[0].click()
    }
  },

  goPage: (dist = 1) => {
    let u
    try {
      u = new URL(window.location.href)
    } catch (e) {
      return
    }
    let page = u.searchParams.get("p")
    if (page === null || page === "") {
      page = "1"
    }
    const cur = parseInt(page, 10)
    if (Number.isNaN(cur)) {
      return
    }
    const dest = cur + dist
    if (dest < 1) {
      return
    }
    u.searchParams.set("p", dest)
    global.openLink(u.href)
  },

  openLinkAndComments: (e) => {
    const linkUrl = e.querySelector(".titleline>a").href
    const commentsUrl = e.nextElementSibling.querySelector(
      "a[href^='item']:not(.titlelink)"
    ).href
    global.openLink(commentsUrl, { newTab: true })
    global.openLink(linkUrl, { newTab: true })
  },
}

// ProductHunt
// -----------
export const ph = {
  openExternal: () => {
    Hints.create("ul[class^='postsList_'] > li > div[class^='item_']", (p) =>
      global.openLink(
        p.querySelector(
          "div[class^='meta_'] > div[class^='actions_'] > div[class^='minorActions_'] > a:nth-child(1)"
        ).href,
        { newTab: true }
      )
    )
  },
}

// Wikipedia
// ---------
export const wp = {
  toggleSimple: () => {
    const u = new URL(window.location.href)
    u.hostname = u.hostname
      .split(".")
      .map((s, i) => {
        if (i === 0) {
          return s === "simple" ? "" : "simple"
        }
        return s
      })
      .filter((s) => s !== "")
      .join(".")
    global.openLink(u.href)
  },

  viewWikiRank: () => {
    const h = document.location.hostname.split(".")
    const lang = h.length > 2 && h[0] !== "www" ? h[0] : "en"
    const p = document.location.pathname.split("/")
    if (p.length < 3 || p[1] !== "wiki") {
      return
    }
    const article = p.slice(2).join("/")
    global.openLink(`https://wikirank.net/${lang}/${article}`, { newTab: true })
  },

  markdownSummary: () =>
    `> [!wiki]
> ${[
      (acc) => [...acc.querySelectorAll("sup")].map((e) => e.remove()),
      (acc) =>
        [...acc.querySelectorAll("b")].forEach((e) => {
          e.innerText = `**${e.innerText}**`
        }),
      (acc) =>
        [...acc.querySelectorAll("i")].forEach((e) => {
          e.innerText = `_${e.innerText}_`
        }),
    ]
      .reduce(
        (acc, f) => (f(acc) && false) || acc,
        document
          .querySelector("#mw-content-text p:not([class]):not([id])")
          .cloneNode(true)
      )
      .innerText.trim()}
>
> — ${global.getMarkdownLink()}`,
}

// devdocs.io
export const dv = {
  scrollSidebar: (dir) =>
    global.scrollElement(document.querySelector("._list"), dir),
  scrollContent: (dir) =>
    global.scrollElement(document.querySelector("._content"), dir),
}

// ikea.com
export const ik = {
  toggleProductDetails: async () => {
    const closeButtonQuery = () =>
      document.querySelector(".range-revamp-modal-header__close")
    const expandButtonQuery = () =>
      document.querySelector(".range-revamp-expander__btn")
    const productDetailsButtonQuery = () =>
      document.querySelector(
        ".range-revamp-product-information-section__button button"
      )

    const openProductDetailsModal = async () => {
      productDetailsButtonQuery().click()
      const expandButton = expandButtonQuery()
      if (expandButton) return expandButton
      return util.until(expandButtonQuery)
    }

    const closeButton = closeButtonQuery()
    if (closeButton) {
      closeButton.click()
      return
    }

    const expandButton = await openProductDetailsModal()
    if (expandButton) expandButton.click()
  },

  toggleProductReviews: () => {
    const btn =
      document.querySelector(".ugc-rr-pip-fe-modal-header__close") ??
      document.querySelector(".range-revamp-chunky-header__reviews")
    if (btn) btn.click()
  },
}
// DOI
export const doi = {
  providers: {
    meta_citation_doi: () =>
      document.querySelector("meta[name=citation_doi]")?.content,
    meta_dcIdentifier_doi: () =>
      document.querySelector("meta[name='dc.Identifier'][scheme=doi]")?.content,
  },
  getLink: (provider) => {
    if (!priv.doi_handler) {
      Front.showBanner("DOI Handler not confingured (see conf.priv.example.js)")
      return
    }
    const doi = provider()
    if (!doi) {
      Front.showBanner("DOI not found")
      return
    }
    return priv.doi_handler(doi)
  },
}

// ChatGPT
export const cg = {
  getNewChatLink: () =>
    [...document.querySelectorAll("a")].find((a) => a.innerText === "New chat"),

  newChat: async () => {
    const clickNewChat = async (newChatLink) => {
      newChatLink.click()
      const gpt4LinkQuery = () =>
        [...document.querySelectorAll('li[class*="group/toggle"]')].find(
          (li) => li.innerText === "GPT-4"
        )
      return await util.until(gpt4LinkQuery)
    }

    const a = cg.getNewChatLink()
    if (a) {
      const gpt4Link = await clickNewChat(a)
      gpt4Link.querySelector("button>div").click()
      return
    }

    location.assign("https://chat.openai.com/?model=gpt-4")
  },
  getChatLinks: () =>
    cg
      .getNewChatLink()
      .parentElement.nextSibling.nextSibling.querySelectorAll("a"),
}
