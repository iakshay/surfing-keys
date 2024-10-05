const { tabOpenLink, Front, Hints, Normal, RUNTIME, Clipboard } = api
import util from "../util"


// Globally applicable actions
// ===========================

export const moveTabNextToTab = (targetId, nextTo, leftOf = false) =>
  browser.tabs.move(targetId, {
    windowId: nextTo.windowId,
    index: nextTo.index - (leftOf ? 1 : 0),
  })

// TODO
// cutTab = async () =>
//   browser.storage.local.set({
//     cutTabEvent: {
//       tabId:     (await browser.tabs.query({ currentWindow: true, active: true }))[0].id,
//       timestamp: new Date(),
//     },
//   })

// pasteTab = async (leftOf = false) => {
//   const { cutTabEvent = null } = await browser.storage.local.get("cutTabEvent")
//   if (!cutTabEvent || (new Date() - cutTabEvent.timestamp) > 60000) return
//   const curTab = (await browser.tabs.query({ currentWindow: true, active: true }))[0]
//   await moveTabNextToTab(cutTabEvent.tabId, curTab, leftOf)
// }

export const dispatchEvents = (type, node, ...eventTypes) =>
  eventTypes.forEach((t) => {
    const e = document.createEvent(type)
    e.initEvent(t, true, true)
    node.dispatchEvent(e)
  })

export const dispatchMouseEvents = dispatchEvents.bind(undefined, [
  "MouseEvents",
])

export const scrollToHash = (hash = null) => {
  const h = (hash || document.location.hash).replace("#", "")
  const e =
    document.getElementById(h) || document.querySelector(`[name="${h}"]`)
  if (!e) {
    return
  }
  e.scrollIntoView({ behavior: "smooth" })
}

// URL Manipulation/querying
// -------------------------
export const vimEditURL = () =>
  Front.showEditor(
    window.location.href,
    (url) => {
      openLink(url)
    },
    "url"
  )

export const getOrgLink = () => `[[${window.location.href}][${document.title}]]`

export const getMarkdownLink = ({
  title = document.title,
  href = window.location.href,
} = {}) => `[${title}](${href})`

// // Custom Omnibar interfaces
// // ------------------------
// export const omnibar = {}
//
// // AWS Services
// omnibar.aws = () => {
//   // const services = [
//   //   {
//   //     title: "EC2",
//   //     url:   "https://cn-northwest-1.console.amazonaws.cn/ec2/v2/home?region=cn-northwest-1",
//   //   },
//   //   {
//   //     title: "Elastic Beanstalk",
//   //     url:   "https://cn-northwest-1.console.amazonaws.cn/elasticbeanstalk/home?region=cn-northwest-1",
//   //   },
//   //   {
//   //     title: "Batch",
//   //     url:   "https://cn-northwest-1.console.amazonaws.cn/batch/home?region=cn-northwest-1",
//   //   },
//   // ]
//   // Front.openOmnibar({ type: "UserURLs", extra: services })
//   Front.openOmnibar({
//     type:  "Custom",
//     extra: {
//       prompt:  "AWS",
//       onInput: console.log,
//     },
//   })
// }

// Surfingkeys-specific actions
// ----------------------------
export const openAnchor =
  ({ newTab = false, active = true, prop = "href" } = {}) =>
  (a) =>
    openLink(a[prop], { newTab, active })

export const openLink = (url, { newTab = false, active = true } = {}) => {
  if (newTab) {
    RUNTIME("openLink", {
      tab: { tabbed: true, active },
      url: url instanceof URL ? url.href : url,
    })
    return
  }
  window.location.assign(url)
}

export const editSettings = () =>
  tabOpenLink(chrome.extension.getURL("/pages/options.html"))

export const togglePdfViewer = () => {
  Front.showBanner("PDF toggle.")
  chrome.storage.local.get("noPdfViewer", (resp) => {
    if (!resp.noPdfViewer) {
      chrome.storage.local.set({ noPdfViewer: 1 }, () => {
        Front.showBanner("PDF viewer disabled.")
      })
    } else {
      chrome.storage.local.remove("noPdfViewer", () => {
        Front.showBanner("PDF viewer enabled.")
      })
    }
  })
}

export const previewLink = () =>
  util.createHints("a[href]", (a) =>
    Front.showEditor(a.href, (url) => openLink(url), "url")
  )

export const scrollElement = (el, dir) => {
  dispatchMouseEvents(el, "mousedown")
  Normal.scroll(dir)
}
