import gulp from "gulp"
import replace from "gulp-replace"
import rename from "gulp-rename"
import { deleteAsync } from "del"
import gulpNotify from "gulp-notify"
import fs from "fs/promises"
import url from "url"
import { exec } from "child_process"
import paths, { getPath, getSrcPath } from "./paths.ts"

const requireJson = async (f) => JSON.parse(await fs.readFile(f))
const log = (...msg) => process.stderr.write(`${msg.join("\n")}\n`)

const copyrightYearOne = 2017

const { URL } = url

const {
  task, src, dest, parallel, series,
} = gulp

const escapeHTML = (text) =>
  String(text).replace(
    /[&<>"'`=/]/g,
    (s) =>
      ({
        "&":  "&amp;",
        "<":  "&lt;",
        ">":  "&gt;",
        "\"": "&quot;",
        "'":  "&#39;",
        "/":  "&#x2F;",
        "`":  "&#x60;",
        "=":  "&#x3D;",
      }[s]),
  )

const pkg = await requireJson(getPath(paths.pkgJson))

const getSources = (() => {
  let sources = null
  return async () => {
    if (sources !== null) {
      return sources
    }
    // Create stubs for document methods which are used by uhtml
    const oldDocument = global.document
    global.document = {
      createDocumentFragment() {},
      createElement() {},
      createElementNS() {},
      createTextNode() {},
      createTreeWalker() {},
      importNode() {},
    }
    sources = await Object.fromEntries(
      await Promise.all(
        Object.entries(paths.sources).map(async ([name, srcPath]) => [
          name,
          (await import(getSrcPath(srcPath))).default,
        ]),
      ),
    )
    global.document = oldDocument
    return sources
  }
})()

const notify = Object.assign(
  (opts, ...args) =>
    gulpNotify(
      {
        icon:    null,
        onLast:  true,
        timeout: 2000,
        ...opts,
      },
      ...args,
    ),
  gulpNotify,
)

notify.onError = (opts, ...args) =>
  gulpNotify.onError(
    {
      onLast:  true,
      timeout: 7500,
      ...opts,
    },
    ...args,
  )

task("clean", () => deleteAsync(["build", ".cache", ".tmp-gulp-compile-*"]))

task("check-priv", async () => {
  try {
    await fs.stat(getSrcPath(paths.sources.priv))
  } catch (e) {
    log(
      `Notice: Initializing ${paths.sources.confPriv}. Configure your API keys here.`,
    )
    return fs.copyFile(
      getPath(paths.confPrivExample),
      getSrcPath(paths.sources.confPriv),
      fs.constants.COPYFILE_EXCL,
    )
  }
  return Promise.resolve()
})

const parseContributor = (contributor) => {
  let c = contributor
  if (typeof contributor === "string") {
    const m = contributor.match(
      /^(?<name>.*?)\s*(<(?<email>.*?)>)?\s*(\((?<url>.*?)\))?$/,
    )
    if (!m) {
      throw new Error(`couldn't parse contributor '${contributor}'`)
    }
    c = m.groups
  } else if (typeof contributor !== "object") {
    throw new Error(
      `expected contributor to be of type 'string' or 'object', got '${typeof contributor}'`,
    )
  }
  if (!c.name) {
    return null
  }
  return `${c.url ? `<a href="${c.url}">` : ""}${c.name}${c.url ? "</a>" : ""}`
}

task(
  "docs",
  parallel(async () => {
    const { searchEngines, conf, keys } = await getSources()
    let searchEnginesTable = Object.keys(searchEngines).sort((a, b) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })

    let keysTable = Object.entries(keys.maps)
      .map(([key, maps]) => [key, maps.filter((map) => !map.hide)])
      .filter(([_, maps]) => maps.length > 0)
      .map(([key]) => key)
      .sort((a, b) => {
        if (a === "global") return -1
        if (b === "global") return 1
        if (a < b) return -1
        if (a > b) return 1
        return 0
      })

    searchEnginesTable = await searchEnginesTable.reduce(async (acc1p, k) => {
      const acc1 = await acc1p
      const c = searchEngines[k]
      const u = new URL(c.domain ? `https://${c.domain}` : c.search)
      const domain = u.hostname
      const s = ""

      const favicon = `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" width="16px">`
      const privNote = c.priv
        ? " <a title=\"requires private API key\" href=\"#optional-private-api-key-configuration\">&#8727;</a>"
        : ""
      const localNote = c.local
        ? " <a title=\"requires local web server\" href=\"#running-the-local-web-server\">&#8224;</a>"
        : ""

      return `${acc1}
  <tr>
    <td><a href="${u.protocol}//${domain}">${favicon}</a></td>
    <td><code>${c.alias}</code></td>
    <td>${c.name}${privNote}${localNote}</td>
    <td><a href="${u.protocol}//${domain}">${domain}</a></td>
    <td>${s}</td>
  </tr>`
    }, Promise.resolve(""))

    keysTable = await keysTable.reduce(async (acc1p, domain) => {
      const acc1 = await acc1p
      const header = "<tr><td><strong>Mapping</strong></td><td><strong>Description</strong></td></tr>"
      const c = keys.maps[domain]
      const maps = c.reduce((acc2, map) => {
        let leader = ""
        if (typeof map.leader !== "undefined") {
          leader = map.leader
        } else if (domain === "global") {
          leader = ""
        } else {
          leader = conf.siteleader
        }
        const mapStr = escapeHTML(
          `${leader}${map.alias}`.replace(" ", "<space>"),
        )
        return `${acc2}<tr><td><code>${mapStr}</code></td><td>${map.description}</td></tr>\n`
      }, "")
      let domainStr = "<strong>global</strong>"
      let favicon = ""
      if (domain !== "global") {
        favicon = `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" width="16px">`
        domainStr = `<a href="//${domain}">${favicon}${domain}</a>`
      }
      return `${acc1}<tr><th colspan="2">${domainStr}</th></tr>${header}\n${maps}`
    }, Promise.resolve(""))

    const year = new Date().getFullYear()
    const copyrightYears = `${
      copyrightYearOne !== year
        ? `${copyrightYearOne}-${year}`
        : copyrightYearOne
    }`
    let copyright = `<p><h4>Author</h4>&copy; ${copyrightYears} ${parseContributor(
      pkg.author,
    )}</p>`
    if (Array.isArray(pkg.contributors) && pkg.contributors.length > 0) {
      copyright += "<p><h4>Contributors</h4><ul>"
      copyright += pkg.contributors.reduce(
        (acc, c) => `${acc}<li>${parseContributor(c)}</li>`,
        "",
      )
      copyright += "</ul></p>"
    }
    copyright += `<p><h4>License</h4>Released under the <a href="./LICENSE">${pkg.license} License</a></p>`

    const notice = "<!-- NOTICE: This file is auto-generated. Do not edit directly. -->"

    return src([getPath(paths.readme)])
      .pipe(replace("<!--{{NOTICE}}-->", notice))
      .pipe(
        replace(
          "<!--{{SEARCH_ENGINES_COUNT}}-->",
          Object.keys(searchEngines).length,
        ),
      )
      .pipe(replace("<!--{{SEARCH_ENGINES_TABLE}}-->", searchEnginesTable))
      .pipe(
        replace(
          "<!--{{KEYS_MAPS_COUNT}}-->",
          Object.values(keys.maps).reduce((acc, m) => acc + m.length, 0),
        ),
      )
      .pipe(
        replace("<!--{{KEYS_SITES_COUNT}}-->", Object.keys(keys.maps).length),
      )
      .pipe(replace("<!--{{KEYS_TABLE}}-->", keysTable))
      .pipe(replace("<!--{{COPYRIGHT}}-->", copyright))
      .pipe(rename(paths.readmeOut))
      .pipe(dest(paths.dirname))
  }),
)

function viteBuild(done) {
  exec('vite build', (err, stdout, stderr) => {
      if (err) {
          console.error(`Error during Vite build: ${err.message}`);
          return done(err);
      }
      console.log(`Vite build output: ${stdout}`);
      if (stderr) {
          console.error(`Vite build errors: ${stderr}`);
      }
      done();
  });
}

task("build", viteBuild)

task("build-full", series(parallel("docs", "clean"), "build"))

const watch = (g, t) => () =>
  gulp.watch(g, { ignoreInitial: false, usePolling: true }, t)

const srcWatchPat = getSrcPath("*.(js|mjs|css)")

task(
  "watch",
  watch(
    [srcWatchPat, getPath(paths.readme), getPath(paths.assets, "**/*")],
    series("build-full"),
  ),
)
task("default", series("build"))
