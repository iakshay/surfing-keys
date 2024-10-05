import ghReservedNames from "github-reserved-names"
const { Front} = api
import util from "../util"

// GitHub
// ------
export default {
  star:
    ({ toggle = false } = {}) =>
    async () => {
      const hasDisplayNoneParent = (e) =>
        window.getComputedStyle(e).display === "none" ||
        (e.parentElement ? hasDisplayNoneParent(e.parentElement) : false)

      const starContainers = Array.from(
        document.querySelectorAll("div.starring-container")
      ).filter((e) => !hasDisplayNoneParent(e))

      let container
      switch (starContainers.length) {
        case 0:
          return
        case 1:
          ;[container] = starContainers
          break
        default:
          try {
            container = await util.createHints(starContainers, { action: null })
          } catch (_) {
            return
          }
      }

      const repoUrl = container.parentElement.parentElement?.matches(
        "ul.pagehead-actions"
      )
        ? window.location.pathname
        : new URL(container.parentElement.querySelector("form").action).pathname

      const status = container.classList.contains("on")
      const repo = repoUrl.slice(1).split("/").slice(0, 2).join("/")

      let star = "★"
      let statusMsg = "starred"
      let copula = "is"

      if ((status && toggle) || (!status && !toggle)) {
        statusMsg = `un${statusMsg}`
        star = "☆"
      }

      if (toggle) {
        copula = "has been"
        container
          .querySelector(
            status
              ? ".starred button, button.starred"
              : ".unstarred button, button.unstarred"
          )
          .click()
      }

      Front.showBanner(`${star} Repository ${repo} ${copula} ${statusMsg}!`)
    },
  parseRepo: (url = window.location.href, rootOnly = false) => {
    let u
    try {
      u = url instanceof URL ? url : new URL(url)
    } catch (e) {
      u = new URL(`https://github.com/${url}`)
    }
    const [user, repo, ...rest] = u.pathname.split("/").filter((s) => s !== "")
    const isRoot = rest.length === 0
    const cond =
      ["github.com", "gist.github.com", "raw.githubusercontent.com"].includes(
        u.hostname
      ) &&
      typeof user === "string" &&
      user.length > 0 &&
      typeof repo === "string" &&
      repo.length > 0 &&
      (isRoot || rootOnly === false) &&
      /^([a-zA-Z0-9]+-?)+$/.test(user) &&
      !ghReservedNames.check(user)
    return cond
      ? {
          type: "repo",
          user,
          repo,
          owner: user,
          name: repo,
          href: url,
          url: u,
          repoBase: `${user}/${repo}`,
          repoRoot: isRoot,
          repoPath: rest,
        }
      : null
  },

  parseUser: (url = window.location.href, rootOnly = false) => {
    const u = url instanceof URL ? url : new URL(url)
    const [user, ...rest] = u.pathname.split("/").filter((s) => s !== "")
    const isRoot = rest.length === 0
    const cond =
      u.origin === window.location.origin &&
      typeof user === "string" &&
      user.length > 0 &&
      (rootOnly === false || rest.length === 0) &&
      /^([a-zA-Z0-9]+-?)+$/.test(user) &&
      !ghReservedNames.check(user)
    return cond
      ? {
          type: "user",
          name: user,
          user,
          href: url,
          url: u,
          userRoot: isRoot,
          userPath: rest,
        }
      : null
  },

  parseFile: (url = window.location.href) => {
    const u = url instanceof URL ? url : new URL(url)
    const [user, repo, pathType, commitHash, ...rest] = u.pathname
      .split("/")
      .filter((s) => s !== "")
    const cond =
      u.origin === window.location.origin &&
      typeof user === "string" &&
      user.length > 0 &&
      typeof repo === "string" &&
      repo.length > 0 &&
      typeof pathType === "string" &&
      (pathType === "blob" || pathType === "tree") &&
      typeof commitHash === "string" &&
      commitHash.length > 0 &&
      /^([a-zA-Z0-9]+-?)+$/.test(user) &&
      !ghReservedNames.check(user)
    if (!cond) return null
    const f = {
      type: "file",
      user,
      repo,
      pathType,
      commitHash,
      isDirectory: pathType === "tree",
      href: url,
      url: u,
      filePath: rest,
      repoBase: `/${user}/${repo}`,
    }
    f.rawUrl = f.isDirectory
      ? null
      : `https://raw.githubusercontent.com/${f.user}/${f.repo}/${
          f.commitHash
        }/${f.filePath.join("/")}`
    return f
  },

  parseCommit: (url = window.location.href) => {
    const u = url instanceof URL ? url : new URL(url)
    const [user, repo, commit, commitHash] = u.pathname
      .split("/")
      .filter((s) => s !== "")
    const cond =
      u.origin === window.location.origin &&
      typeof user === "string" &&
      user.length > 0 &&
      typeof repo === "string" &&
      repo.length > 0 &&
      typeof commit === "string" &&
      commit === "commit" &&
      typeof commitHash === "string" &&
      commitHash.length > 0 &&
      /^([a-zA-Z0-9]+-?)+$/.test(user) &&
      !ghReservedNames.check(user)
    return cond
      ? {
          type: "commit",
          user,
          repo,
          commitHash,
          href: url,
          url: u,
        }
      : null
  },

  parseIssue: (url = window.location.href) => {
    const u = url instanceof URL ? url : new URL(url)
    const [user, repo, maybeIssues, ...rest] = u.pathname
      .split("/")
      .filter((s) => s !== "")
    const isRoot = rest.length === 0
    const cond =
      u.origin === window.location.origin &&
      typeof user === "string" &&
      user.length > 0 &&
      typeof repo === "string" &&
      repo.length > 0 &&
      maybeIssues === "issues" &&
      /^([a-zA-Z0-9]+-?)+$/.test(user) &&
      !ghReservedNames.check(user)
    return cond
      ? {
          href: url,
          url: u,
          ...(isRoot
            ? {
                type: "issues",
                issuePath: rest,
              }
            : {
                type: "issue",
                number: rest[0],
                issuePath: rest,
              }),
        }
      : null
  },

  parsePull: (url = window.location.href) => {
    const u = url instanceof URL ? url : new URL(url)
    const [user, repo, maybePulls, ...rest] = u.pathname
      .split("/")
      .filter((s) => s !== "")
    const isRoot = rest.length === 0
    const cond =
      u.origin === window.location.origin &&
      typeof user === "string" &&
      user.length > 0 &&
      typeof repo === "string" &&
      repo.length > 0 &&
      /^pulls?$/.test(maybePulls) &&
      /^([a-zA-Z0-9]+-?)+$/.test(user) &&
      !ghReservedNames.check(user)
    return cond
      ? {
          href: url,
          url: u,
          ...(isRoot
            ? {
                type: "pulls",
                pullPath: rest,
              }
            : {
                type: "pull",
                number: rest[0],
                pullPath: rest,
              }),
        }
      : null
  },

  isUser: (url = window.location.href, rootOnly = true) =>
    gh.parseUser(url, rootOnly) !== null,

  isRepo: (url = window.location.href, rootOnly = true) =>
    gh.parseRepo(url, rootOnly) !== null,

  isFile: (url = window.location.href) => gh.parseFile(url) !== null,
  isCommit: (url = window.location.href) => gh.parseCommit(url) !== null,
  isIssue: (url = window.location.href) => gh.parseIssue(url) !== null,
  isPull: (url = window.location.href) => gh.parsePull(url) !== null,

  openRepo: () => util.createHintsFiltered((a) => gh.isRepo(a.href)),
  openUser: () => util.createHintsFiltered((a) => gh.isUser(a.href)),
  openFile: () => util.createHintsFiltered((a) => gh.isFile(a.href)),
  openCommit: () => util.createHintsFiltered((a) => gh.isCommit(a.href)),
  openIssue: () => util.createHintsFiltered((a) => gh.isIssue(a.href)),
  openPull: () => util.createHintsFiltered((a) => gh.isPull(a.href)),

  openPage: (path) => openLink(`https://github.com/${path}`),

  openRepoPage: (repoPath) => {
    const repo = gh.parseRepo()
    if (repo === null) return
    gh.openPage(`${repo.repoBase}${repoPath}`)
  },

  openRepoOwner: () => {
    const repo = gh.parseRepo()
    if (repo === null) return
    gh.openPage(`${repo.owner}`)
  },

  openGithubPagesRepo: () => {
    const user = window.location.hostname.split(".")[0]
    const repo = window.location.pathname.split("/")[1] ?? ""
    gh.openPage(`${user}/${repo}`)
  },

  openSourceFile: () => {
    const p = window.location.pathname.split("/")
    gh.openPage(`${[...p.slice(1, 3), "tree", ...p.slice(3)].join("/")}`)
  },

  openProfile: () =>
    gh.openPage(
      `${document.querySelector("meta[name='user-login']")?.content}`
    ),

  toggleLangStats: () =>
    document.querySelector(".repository-lang-stats-graph")?.click(),

  goParent: () => {
    const segments = window.location.pathname.split("/").filter((s) => s !== "")
    const newPath = (() => {
      const [user, repo, pathType] = segments
      switch (segments.length) {
        case 0:
          return false
        case 4:
          switch (pathType) {
            case "blob":
            case "tree":
              return [user, repo]
            case "pull":
              return [user, repo, "pulls"]
            default:
              break
          }
          break
        case 5:
          if (pathType === "blob") {
            return [user, repo]
          }
          break
        default:
          break
      }
      return segments.slice(0, segments.length - 1)
    })()
    if (newPath !== false) {
      const u = `${window.location.origin}/${newPath.join("/")}`
      openLink(u)
    }
  },

  viewSourceGraph: () => {
    const url = new URL("https://sourcegraph.com/github.com")
    let page = null
    // The following conditional expressions are indeed intended to be
    // assignments, this is not a bug.
    if ((page = gh.parseFile(window.location.href)) !== null) {
      const filePath = page.filePath.join("/")
      url.pathname += `/${page.user}/${page.repo}@${page.commitHash}/-/${page.pathType}/${filePath}`
      if (window.location.hash !== "") {
        url.hash = window.location.hash
      } else if (!util.isElementInViewport(document.querySelector("#L1"))) {
        for (const e of document.querySelectorAll(".js-line-number")) {
          if (util.isElementInViewport(e)) {
            url.hash = e.id
            break
          }
        }
      }
    } else if ((page = gh.parseCommit(window.location.href)) !== null) {
      url.pathname += `/${page.user}/${page.repo}@${page.commitHash}`
    } else if ((page = gh.parseRepo(window.location.href)) !== null) {
      url.pathname += `/${page.user}/${page.repo}`
    } else {
      url.pathname = ""
    }

    openLink(url.href, { newTab: true })
  },

  openInDev: ({ newTab = false } = {}) => {
    const url = new URL(window.location.href)
    url.hostname = "github.dev"
    openLink(url.href, { newTab })
  },

  selectFile: async ({ files = true, directories = true } = {}) => {
    if (!(files || directories))
      throw new Error("At least one of 'files' or 'directories' must be true")

    const test = (f) =>
      f && !((!directories && f.isDirectory) || (!files && !f.isDirectory))

    let file = gh.parseFile()
    if (test(file)) return file

    const repo = gh.parseRepo()
    if (repo === null) throw new Error("Not a repository")

    const elem = util.createHintsFiltered((a) => {
      const f = gh.parseFile(a.href)
      return f && f.isDirectory === false
    }, null)

    file = gh.parseFile(elem.href)
    if (!test(file)) throw new Error("Not a file")
    return file
  },

  openFileFromClipboard: async ({ newTab = true } = {}) => {
    const clip = await navigator.clipboard.readText()
    if (typeof clip !== "string" || clip.length === 0) {
      return
    }

    const loc = window.location.href
    const dest = {
      user: null,
      repo: null,
      commitHash: "master",
    }

    const file = gh.parseFile(loc)
    if (file !== null) {
      dest.user = file.user
      dest.repo = file.repo
      dest.commitHash = file.commitHash
    } else {
      const commit = gh.parseCommit(loc)
      if (commit !== null) {
        dest.user = commit.user
        dest.repo = commit.repo
        dest.commitHash = commit.commitHash
      } else {
        const repository = gh.parseRepo(loc)
        if (repository !== null) {
          return
        }
        dest.user = repository.user
        dest.repo = repository.repo
      }
    }

    openLink(
      `https://github.com/${dest.user}/${dest.repo}/tree/${dest.commitHash}/${clip}`,
      { newTab }
    )
  },
}
