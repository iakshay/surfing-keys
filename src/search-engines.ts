import priv from "./conf.priv"
import util from "./util"

const {
  htmlPurify,
  htmlNode,
  htmlForEach,
  suggestionItem,
  urlItem,
  prettyDate,
  getDuckduckgoFaviconUrl,
  localStorage,
  runtimeHttpRequest,
} = util

// TODO: use a Babel loader to import this image
const wpDefaultIcon = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2056%2056%22%20enable-background%3D%22new%200%200%2056%2056%22%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23eee%22%20d%3D%22M0%200h56v56h-56z%22%2F%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23999%22%20d%3D%22M36.4%2013.5h-18.6v24.9c0%201.4.9%202.3%202.3%202.3h18.7v-25c.1-1.4-1-2.2-2.4-2.2zm-6.2%203.5h5.1v6.4h-5.1v-6.4zm-8.8%200h6v1.8h-6v-1.8zm0%204.6h6v1.8h-6v-1.8zm0%2015.5v-1.8h13.8v1.8h-13.8zm13.8-4.5h-13.8v-1.8h13.8v1.8zm0-4.7h-13.8v-1.8h13.8v1.8z%22%2F%3E%0A%3C%2Fsvg%3E%0A"

const locale = typeof navigator !== "undefined" ? navigator.language : ""

const completions = {}

const googleCustomSearch = (opts) => {
  let favicon = "https://google.com/favicon.ico"
  if (opts.favicon) {
    favicon = opts.favicon
  } else if (opts.domain) {
    favicon = getDuckduckgoFaviconUrl(`https://${opts.domain}`)
  } else if (opts.search) {
    favicon = getDuckduckgoFaviconUrl(opts.search)
  }
  return {
    favicon,
    compl: `https://www.googleapis.com/customsearch/v1?key=${
      priv.keys.google_cs
    }&cx=${priv.keys[`google_cx_${opts.alias}`]}&q=`,
    search: `https://cse.google.com/cse/publicurl?cx=${
      priv.keys[`google_cx_${opts.alias}`]
    }&q=`,
    callback: (response) =>
      JSON.parse(response.text).items.map(
        (s) => suggestionItem({ url: s.link })`
        <div>
          <div class="title"><strong>${htmlPurify(s.htmlTitle)}</strong></div>
          <div>${htmlPurify(s.htmlSnippet)}</div>
        </div>
      `,
      ),
    priv: true,
    ...opts,
  }
}

// ****** Technical Resources ****** //

// AWS
completions.aw = {
  alias:  "aw",
  name:   "aws",
  search: "https://docs.aws.amazon.com/search/doc-search.html?searchPath=documentation&searchQuery=",
  // compl:  "https://autosuggest-search-api.docs.aws.amazon.com/auto-suggest/",
}

// AlternativeTo
completions.at = {
  alias:  "at",
  name:   "alternativeTo",
  search: "https://alternativeto.net/browse/search/?q=",
  // compl: `https://zidpns2vb0-dsn.algolia.net/1/indexes/items?x-algolia-api-key=88489cdf3a8fbfe07a2f607bf1568330&x-algolia-application-id=ZIDPNS2VB0&query=`,
  priv:   true,
}

completions.at.callback = async (response) => {
  const res = JSON.parse(response.text)
  return res.hits.map((s) => {
    let title = htmlPurify(s.name)
    let prefix = ""
    if (s._highlightResult) {
      if (s._highlightResult.name) {
        title = s._highlightResult.name.value
      }
    }
    if (s.likes) {
      prefix += `[↑${parseInt(s.likes, 10)}] `
    }

    const hasIcon = s?.images
      .filter((_) => _.type == "Icon")
      .at(0)
      ?.signedImages?.at(0)?.signedURL
    const icon = hasIcon ?? wpDefaultIcon
    const t = suggestionItem({ url: `/software/${s.urlName}` })`
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${icon}" alt="${s.name}">
        <div>
          <div class="title"><strong>${title}</strong></div>
          <span>${htmlPurify(s.tagLine || s.description || "")}</span>
        </div>
      </div>
    `

    return t
  })
}

// Chrome Webstore
completions.cs = googleCustomSearch({
  alias:  "cs",
  name:   "chromestore",
  search: "https://chrome.google.com/webstore/search/",
})

// OWASP Wiki
completions.ow = {
  alias:  "ow",
  name:   "owasp",
  search: "https://www.owasp.org/index.php?go=go&search=",
  compl:
    "https://www.owasp.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.ow.callback = (response) => JSON.parse(response.text)[1]

// StackOverflow
completions.so = {
  alias:  "so",
  name:   "stackoverflow",
  search: "https://stackoverflow.com/search?q=",
  compl:
    "https://api.stackexchange.com/2.2/search/advanced?pagesize=10&order=desc&sort=relevance&site=stackoverflow&q=",
}

completions.so.callback = (response) =>
  JSON.parse(response.text).items.map((s) =>
    urlItem(`[${s.score}] ${s.title}`, s.link, { query: false }))

// StackExchange - all sites
completions.se = {
  alias:  "se",
  name:   "stackexchange",
  search: "https://stackexchange.com/search?q=",
  compl:  "https://duckduckgo.com/ac/?q=!stackexchange%20",
}

completions.se.callback = (response) =>
  JSON.parse(response.text).map((r) => r.phrase.replace(/^!stackexchange /, ""))

// DockerHub repo search
completions.dh = {
  alias:  "dh",
  name:   "dockerhub",
  search: "https://hub.docker.com/search/?page=1&q=",
  compl:  "https://hub.docker.com/v2/search/repositories/?page_size=20&query=",
}

completions.dh.callback = (response) =>
  JSON.parse(response.text).results.map((s) => {
    let meta = ""
    let repo = s.repo_name
    meta += `[★${s.star_count}] `
    meta += `[↓${s.pull_count}] `
    if (repo.indexOf("/") === -1) {
      repo = `_/${repo}`
    }
    return suggestionItem({ url: `https://hub.docker.com/r/${repo}` })`
      <div>
        <div class="title"><strong>${repo}</strong></div>
        <div>${meta}</div>
        <div>${s.short_description}</div>
      </div>
    `
  })

// GitHub
completions.gh = {
  alias:  "gh",
  name:   "github",
  search: "https://github.com/search?q=",
  compl:  "https://api.github.com/search/repositories?sort=stars&order=desc&q=",
}

completions.gh.callback = (response) =>
  JSON.parse(response.text).items.map((s) => {
    let prefix = ""
    if (s.stargazers_count) {
      prefix += `[★${parseInt(s.stargazers_count, 10)}] `
    }
    return urlItem(prefix + s.full_name, s.html_url, {
      query: s.full_name,
      desc:  s.description,
    })
  })

// Vim Wiki
completions.vw = {
  alias:  "vw",
  name:   "vimwiki",
  search: "https://vim.fandom.com/wiki/Special:Search?query=",
  compl:
    "https://vim.fandom.com/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.vw.callback = (response) =>
  JSON.parse(response.text)[1].map((r) =>
    urlItem(r, `https://vim.fandom.com/wiki/${encodeURIComponent(r)}`, {
      query: false,
    }))

// ****** Shopping & Food ****** //

// Amazon
completions.az = {
  alias:  "az",
  name:   "amazon",
  search: "https://smile.amazon.com/s/?field-keywords=",
  compl:
    "https://completion.amazon.com/search/complete?method=completion&mkt=1&search-alias=aps&q=",
}

completions.az.callback = (response) => JSON.parse(response.text)[1]

// Craigslist
completions.cl = {
  alias:  "cl",
  name:   "craigslist",
  search: "https://www.craigslist.org/search/sss?query=",
  compl:
    "https://www.craigslist.org/suggest?v=12&type=search&cat=sss&area=1&term=",
}

completions.cl.callback = (response) => JSON.parse(response.text)

// EBay
completions.eb = {
  alias:  "eb",
  name:   "ebay",
  search: "https://www.ebay.com/sch/i.html?_nkw=",
  compl:  "https://autosug.ebay.com/autosug?callback=0&sId=0&kwd=",
}

completions.eb.callback = (response) => JSON.parse(response.text).res.sug

// Yelp
completions.yp = {
  alias:  "yp",
  name:   "yelp",
  search: "https://www.yelp.com/search?find_desc=",
  compl:  "https://www.yelp.com/search_suggest/v2/prefetch?prefix=",
}

completions.yp.callback = (response) => {
  const res = JSON.parse(response.text).response
  const words = []
  res.forEach((r) => {
    r.suggestions.forEach((s) => {
      const w = s.query
      if (words.indexOf(w) === -1) {
        words.push(w)
      }
    })
  })
  return words
}

// ****** General References, Calculators & Utilities ****** //

// TODO

const parseDatamuseRes = (res, o = {}) => {
  const opts = {
    maxDefs:  -1,
    ellipsis: false,
    ...o,
  }
  return res.map((r) => {
    const defs = []
    let defsHtml = ""
    if (
      (opts.maxDefs <= -1 || opts.maxDefs > 0)
      && r.defs
      && r.defs.length > 0
    ) {
      for (const d of r.defs.slice(
        0,
        opts.maxDefs <= -1 ? undefined : opts.maxDefs,
      )) {
        const ds = d.split("\t")
        const partOfSpeech = `(${ds[0]})`
        const def = ds[1]
        defs.push(`<span><em>${partOfSpeech}</em> ${def}</span>`)
      }
      if (opts.ellipsis && r.defs.length > opts.maxDefs) {
        defs.push("<span><em>&hellip;</em></span>")
      }
      defsHtml = `<div>${defs.join("<br />")}</div>`
    }
    return suggestionItem({ url: `${opts.wordBaseURL}${r.word}` })`
      <div>
        <div class="title"><strong>${r.word}</strong></div>
        ${htmlPurify(defsHtml)}
      </div>
    `
  })
}

// Dictionary
completions.de = {
  alias:  "de",
  name:   "define",
  search: "http://onelook.com/?w=",
  compl:  "https://api.datamuse.com/words?md=d&sp=%s*",
  opts:   {
    maxDefs:     16,
    ellipsis:    true,
    wordBaseURL: "http://onelook.com/?w=",
  },
}

completions.de.callback = (response) => {
  const res = JSON.parse(response.text)
  return parseDatamuseRes(res, completions.de.opts)
}

// Thesaurus
completions.th = {
  alias:  "th",
  name:   "thesaurus",
  search: "https://www.onelook.com/thesaurus/?s=",
  compl:  "https://api.datamuse.com/words?md=d&ml=%s",
  opts:   {
    maxDefs:     3,
    ellipsis:    true,
    wordBaseURL: "http://onelook.com/thesaurus/?s=",
  },
}

completions.th.callback = (response) => {
  const res = JSON.parse(response.text)
  return parseDatamuseRes(res, completions.th.opts)
}

// Wikipedia
completions.wp = {
  alias:  "wp",
  name:   "wikipedia",
  search: "https://en.wikipedia.org/w/index.php?search=",
  compl:
    "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
}

completions.wp.callback = (response) =>
  Object.values(JSON.parse(response.text).query.pages).map((p) => {
    const img = p.thumbnail ? p.thumbnail.source : wpDefaultIcon
    return suggestionItem({ url: p.fullurl })`
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${img}">
        <div>
          <div class="title"><strong>${p.title}</strong></div>
          <div class="title">${p.description ?? ""}</div>
        </div>
      </div>
    `
  })

// Wikipedia - Simple English version
completions.ws = {
  alias:  "ws",
  name:   "wikipedia-simple",
  search: "https://simple.wikipedia.org/w/index.php?search=",
  compl:
    "https://simple.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
  callback: completions.wp.callback,
}

// Wiktionary
completions.wt = {
  alias:  "wt",
  name:   "wiktionary",
  search: "https://en.wiktionary.org/w/index.php?search=",
  compl:
    "https://en.wiktionary.org/w/api.php?action=query&format=json&generator=prefixsearch&gpssearch=",
}

completions.wt.callback = (response) =>
  Object.values(JSON.parse(response.text).query.pages).map((p) => p.title)

// WolframAlpha
completions.wa = {
  alias:  "wa",
  name:   "wolframalpha",
  search: "http://www.wolframalpha.com/input/?i=",
  compl:  `http://api.wolframalpha.com/v2/query?appid=${priv.keys.wolframalpha}&format=plaintext,image&output=json&reinterpret=true&input=%s`,
  priv:   true,
}

completions.wa.callback = (response, { query }) => {
  const res = JSON.parse(response.text).queryresult

  if (res.error) {
    return [
      suggestionItem({ url: "https://www.wolframalpha.com/" })`
        <div>
          <div class="title"><strong>Error</strong> (Code ${res.error.code})</div>
          <div class="title">${res.error.msg}</div>
        </div>
      `,
    ]
  }

  if (!res.success) {
    if (res.tips) {
      return [
        suggestionItem({ url: "https://www.wolframalpha.com/" })`
          <div>
            <div class="title"><strong>No Results</strong></div>
            <div class="title">${res.tips.text}</div>
          </div>
        `,
      ]
    }
    if (res.didyoumeans) {
      return res.didyoumeans.map(
        (s) =>
          suggestionItem({ url: "https://www.wolframalpha.com/" })`
          <div>
            <div class="title"><strong>Did you mean...?</strong></div>
            <div class="title">${s.val}</div>
          </div>
        `,
      )
    }
    return [
      suggestionItem({ url: "https://www.wolframalpha.com/" })`
        <div>
          <div class="title"><strong>Error</strong></div>
          <div class="title">An unknown error occurred.</div>
        </div>
      `,
    ]
  }

  const results = []
  res.pods.forEach((p) => {
    const result = {
      title:  p.title,
      values: [],
      url:    `http://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`,
    }
    if (p.numsubpods > 0) {
      if (p.subpods[0].plaintext) {
        result.url = encodeURIComponent(p.subpods[0].plaintext)
        result.copy = p.subpods[0].plaintext
      }
      p.subpods.forEach((sp) => {
        let v = ""
        if (sp.title) {
          v = htmlNode`<strong>${sp.title}</strong>: `
        }
        if (sp.img) {
          v = htmlNode`
            <div>${v}</div>
            <div>
              <img
                src="${sp.img.src}"
                width="${sp.img.width}"
                height="${sp.img.height}"
                style="margin-top: 6px; padding: 12px; border-radius: 12px; background: white"
              >
            </div>
          `
        } else if (sp.plaintext) {
          v = `${v}${sp.plaintext}`
        }
        if (v) {
          v = htmlNode`<div class="title">${v}</div>`
        }
        result.values.push(v)
      })
    }
    if (result.values.length > 0) {
      results.push(result)
    }
  })

  return results.map(
    (r) => suggestionItem({ url: r.url, copy: r.copy, query: r.query })`
    <div>
      <div class="title"><strong>${r.title}</strong></div>
      ${htmlForEach(r.values)}
    </div>`,
  )
}

// ****** Business Utilities & References ****** //

const parseCrunchbase = (response, parse) => {
  const res = JSON.parse(response.text).data.items
  if (res.length === 0) {
    return [
      createSuggestionItem(
        `
      <div>
        <div class="title"><strong>No Results</strong></div>
        <div class="title">Nothing matched your query</div>
      </div>`,
        { url: "https://www.crunchbase.com/" },
      ),
    ]
  }
  const objs = res.map((obj) => parse(obj))
  return objs.map((p) => {
    const domain = p.domain
      ? ` | <a href="https://${p.domain}" target="_blank">${p.domain}</a>`
      : ""
    const location = p.loc ? ` located in <em>${p.loc}</em>` : ""
    return createSuggestionItem(
      `
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${p.img}" alt="${p.name}">
        <div style="display:grid;grid-template-rows:1fr 1fr 0.8fr">
          <div class="title"><strong style="font-size: 1.2em">${p.name}</strong></div>
          <div class="title" style="font-size: 1.2em">${p.desc}</div>
          <div class="title"><em>${p.role}</em>${location}${domain}</div>
        </div>
      </div>`,
      { url: p.url },
    )
  })
}

// Crunchbase Organization Search
completions.co = {
  alias:  "co",
  name:   "crunchbase-orgs",
  search: "https://www.crunchbase.com/textsearch?q=",
  compl:  `https://api.crunchbase.com/v/3/odm_organizations?user_key=${priv.keys.crunchbase}&query=%s`,
  priv:   true,
}

completions.co.callback = (response) =>
  parseCrunchbase(response, (org) => {
    const r = org.properties
    const p = {
      name:   escapeHTML(r.name),
      domain:
        r.domain !== null ? escapeHTML(r.domain).replace(/\/$/, "") : null,
      desc: escapeHTML(r.short_description),
      role: escapeHTML(r.primary_role),
      img:  cbDefaultIcon,
      loc:  "",
      url:  `https://www.crunchbase.com/${r.web_path}`,
    }

    p.loc += r.city_name !== null ? escapeHTML(r.city_name) : ""
    p.loc += r.region_name !== null && p.loc !== "" ? ", " : ""
    p.loc += r.region_name !== null ? escapeHTML(r.region_name) : ""
    p.loc += r.country_code !== null && p.loc !== "" ? ", " : ""
    p.loc += r.country_code !== null ? escapeHTML(r.country_code) : ""

    if (r.profile_image_url !== null) {
      const u = r.profile_image_url
      const img = u.slice(u.indexOf("t_api_images") + "t_api_images".length + 1)
      p.img = `https://res-4.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_100,w_100,f_auto,b_white,q_auto:eco/${img}`
    }

    return p
  })

// Crunchbase People Search
completions.cp = {
  alias:  "cp",
  name:   "crunchbase-people",
  search: "https://www.crunchbase.com/app/search/?q=",
  compl:  `https://api.crunchbase.com/v/3/odm_people?user_key=${priv.keys.crunchbase}&query=%s`,
  priv:   true,
}

completions.cp.callback = (response) =>
  parseCrunchbase(response, (person) => {
    const r = person.properties
    const p = {
      name: `${escapeHTML(r.first_name)} ${escapeHTML(r.last_name)}`,
      desc: "",
      img:  cbDefaultIcon,
      role: "",
      loc:  "",
      url:  `https://www.crunchbase.com/${r.web_path}`,
    }

    p.desc += r.title !== null ? escapeHTML(r.title) : ""
    p.desc += r.organization_name !== null && p.desc !== "" ? ", " : ""
    p.desc
      += r.organization_name !== null ? escapeHTML(r.organization_name) : ""

    p.loc += r.city_name !== null ? escapeHTML(r.city_name) : ""
    p.loc += r.region_name !== null && p.loc !== "" ? ", " : ""
    p.loc += r.region_name !== null ? escapeHTML(r.region_name) : ""
    p.loc += r.country_code !== null && p.loc !== "" ? ", " : ""
    p.loc += r.country_code !== null ? escapeHTML(r.country_code) : ""

    if (r.profile_image_url !== null) {
      const url = r.profile_image_url
      const path = url.split("/")
      const img = encodeURIComponent(path[path.length - 1])
      p.img = `http://public.crunchbase.com/t_api_images/v1402944794/c_pad,h_50,w_50/${img}`
    }

    return p
  })

// ****** Search Engines ****** //

// DuckDuckGo
// completions.dd = {
//   alias: "du",
//   name: "duckduckgo",
//   search: "https://duckduckgo.com/?q=",
//   compl: "https://duckduckgo.com/ac/?q=",
// }

// completions.dd.callback = (response) =>
//   JSON.parse(response.text).map((r) => r.phrase)

// // DuckDuckGo - I'm Feeling Lucky
// completions.D = {
//   alias: "D",
//   name: "duckduckgo-lucky",
//   search: "https://duckduckgo.com/?q=\\",
//   compl: "https://duckduckgo.com/ac/?q=\\",
//   callback: completions.dd.callback,
// }

// // DuckDuckGo Images
// completions.di = {
//   alias: "di",
//   name: "duckduckgo-images",
//   search: "https://duckduckgo.com/?ia=images&iax=images&q=",
//   compl: "https://duckduckgo.com/ac/?ia=images&iax=images&q=",
//   callback: completions.dd.callback,
// }

// // DuckDuckGo Videos
// completions.dv = {
//   alias: "dv",
//   name: "duckduckgo-videos",
//   search: "https://duckduckgo.com/?ia=videos&iax=videos&q=",
//   compl: "https://duckduckgo.com/ac/?ia=videos&iax=videos&q=",
//   callback: completions.dd.callback,
// }

// // DuckDuckGo News
// completions.dn = {
//   alias: "dn",
//   name: "duckduckgo-news",
//   search: "https://duckduckgo.com/?iar=news&ia=news&q=",
//   compl: "https://duckduckgo.com/ac/?iar=news&ia=news&q=",
//   callback: completions.dd.callback,
// }

// // DuckDuckGo Maps
// completions.dm = {
//   alias: "dm",
//   name: "duckduckgo-maps",
//   search: "https://duckduckgo.com/?ia=maps&iax=maps&iaxm=places&q=",
//   compl: "https://duckduckgo.com/ac/?ia=maps&iax=maps&iaxm=places&q=",
//   callback: completions.dd.callback,
// }

// Google
completions.go = {
  alias:  "go",
  name:   "google",
  search: "https://www.google.com/search?q=",
  compl:
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
}

completions.go.callback = (response) => JSON.parse(response.text)[1]

// Google Images
completions.gi = {
  alias:  "gi",
  name:   "google-images",
  search: "https://www.google.com/search?tbm=isch&q=",
  compl:
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&ds=i&q=",
  callback: completions.go.callback,
}

// Google Images (reverse image search by URL)
completions.gI = {
  alias:  "gI",
  name:   "google-reverse-image",
  search: "https://www.google.com/searchbyimage?image_url=",
}

// Google - I'm Feeling Lucky
completions.G = {
  alias:  "G",
  name:   "google-lucky",
  search: "https://www.google.com/search?btnI=1&q=",
  compl:
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
  callback: completions.go.callback,
}

// Google Scholar
completions.gs = {
  alias:  "gs",
  name:   "google-scholar",
  search: "https://scholar.google.com/scholar?q=",
  compl:  "https://scholar.google.com/scholar_complete?q=",
}

completions.gs.callback = (response) => JSON.parse(response.text).l

// Kagi
completions.ka = {
  alias:    "ka",
  name:     "kagi",
  search:   "https://kagi.com/search?q=",
  compl:    "https://kagi.com/autosuggest?q=",
  callback: (response) =>
    JSON.parse(response.text).map((r) => {
      const u = new URL("https://kagi.com/search")
      u.searchParams.append("q", r.t)
      if (r.goto) {
        u.href = r.goto
      }
      return suggestionItem({ url: u.href })`
      <div style="padding: 5px; display: grid; grid-template-columns: 32px 1fr; grid-gap: 15px">
        <img style="width: 32px" src="${
  r.img ? new URL(r.img, "https://kagi.com") : wpDefaultIcon
}" />
        <div>
          <div class="title"><strong>${r.t}</strong></div>
          <div class="title">${r.txt ?? ""}</div>
        </div>
      </div>
    `
    }),
}

// ****** HTML, CSS, JavaScript, NodeJS, ... ****** //

// caniuse
completions.ci = {
  alias:   "ci",
  name:    "caniuse",
  search:  "https://caniuse.com/?search=",
  compl:   "https://caniuse.com/process/query.php?search=",
  favicon: "https://caniuse.com/img/favicon-128.png",
}

completions.ci.getData = async () => {
  const storageKey = "completions.ci.data"
  const storedData = await localStorage.get(storageKey)
  if (storedData) {
    return JSON.parse(storedData)
  }
  const data = JSON.parse(
    await runtimeHttpRequest("https://caniuse.com/data.json"),
  )
  localStorage.set(storageKey, JSON.stringify(data))
  return data
}

completions.ci.callback = async (response) => {
  const { featureIds } = JSON.parse(response.text)
  const allData = await completions.ci.getData()
  return featureIds
    .map((featId) => {
      const feat = allData.data[featId]
      return feat
        ? suggestionItem({ url: `https://caniuse.com/${featId}` })`
          <div>
            <div class="title"><strong>${feat.title}</strong></div>
            <div>${feat.description}</div>
          </div>
        `
        : null
    })
    .filter((item) => !!item)
}

// Chrome Webstore
completions.py = googleCustomSearch({
  alias:  "py",
  name:   "python",
  domain: "python.org",
})

// NodeJS standard library documentation
completions.no = googleCustomSearch({
  alias:  "no",
  name:   "node",
  domain: "nodejs.org",
})

// Mozilla Developer Network (MDN)
completions.md = {
  alias:  "md",
  name:   "mdn",
  search: "https://developer.mozilla.org/search?q=",
  compl:  "https://developer.mozilla.org/api/v1/search?q=",
}

completions.md.callback = (response) => {
  const res = JSON.parse(response.text)
  return res.documents.map(
    (s) =>
      suggestionItem({
        url: `https://developer.mozilla.org/${s.locale}/docs/${s.slug}`,
      })`
      <div>
        <div class="title"><strong>${s.title}</strong></div>
        <div style="font-size:0.8em"><em>${s.slug}</em></div>
        <div>${s.summary}</div>
      </div>
    `,
  )
}

// NPM registry search
completions.np = {
  alias:   "np",
  name:    "npm",
  search:  "https://www.npmjs.com/search?q=",
  compl:   "https://api.npms.io/v2/search/suggestions?size=20&q=",
  favicon: getDuckduckgoFaviconUrl("https://www.npmjs.com"),
}

completions.np.callback = (response) =>
  JSON.parse(response.text).map((s) => {
    const desc = s.package?.description ? s.package.description : ""
    const date = s.package?.date ? prettyDate(new Date(s.package.date)) : ""
    const flags = s.flags
      ? Object.keys(s.flags).map(
        (f) => htmlNode`[<span style='color:#ff4d00'>⚑</span> ${f}] `,
      )
      : []
    return suggestionItem({ url: s.package.links.npm })`
      <div>
        <div>
          <span class="title">${htmlPurify(s.highlight)}</span>
          <span style="font-size: 0.8em">v${s.package.version}</span>
        </div>
        <div>
          <i style="alpha: 0.7; font-size: 0.8em">${date}</i>
          <span>${htmlForEach(flags)}</span>
        </div>
        <div>${desc}</div>
      </div>
    `
  })

// TypeScript docs
completions.ts = {
  alias:   "ts",
  name:    "typescript",
  domain:  "www.typescriptlang.org",
  search:  "https://duckduckgo.com/?q=site%3Awww.typescriptlang.org+",
  compl:   "https://bgcdyoiyz5-dsn.algolia.net/1/indexes/typescriptlang?x-algolia-application-id=BGCDYOIYZ5&x-algolia-api-key=37ee06fa68db6aef451a490df6df7c60&query=",
  favicon: "https://www.typescriptlang.org/favicon-32x32.png",
}

completions.ts.callback = async (response) => {
  const res = JSON.parse(response.text)
  const t = Object.entries(
    res.hits.reduce((acc, hit) => {
      const { lvl0 } = hit.hierarchy
      if (!acc[lvl0]) {
        acc[lvl0] = []
      }
      acc[lvl0].push(hit)
      return acc
    }, {}),
  )
    .sort(([lvl0A], [lvl0B]) => lvl0A.localeCompare(lvl0B))
    .flatMap(([lvl0, hits]) => hits.map((hit) => {
      const lvl = hit.type
      const hierarchy = Object.entries(hit.hierarchy).reduce(
        (acc, [lvl, name]) => {
          if (!name || lvl === hit.type) {
            return acc
          }
          return `${acc ? `${acc} > ` : ""}${name}`
        },
        "",
      )
      const title = hit.hierarchy[lvl]
      const desc = hit.content
      return suggestionItem({ url: hit.url })`
          <div>
            <div style="font-weight: bold">
              <span style="opacity: 0.6">${htmlPurify(hierarchy)}${
  title ? " > " : ""
}</span>
              <span style="">${htmlPurify(title)}</span>
            </div>
            <div>${htmlPurify(desc)}</div>
            <div style="opacity: 0.6; line-height: 1.3em">${htmlPurify(
    hit.url,
  )}</div>
          </div>
        `
    }))
  console.log(t)
  return t
}

// ****** Social Media & Entertainment ****** //

// Hacker News (YCombinator)
completions.hn = {
  alias:   "hn",
  name:    "hackernews",
  domain:  "news.ycombinator.com",
  search:  "https://hn.algolia.com/?query=",
  compl:   "https://hn.algolia.com/api/v1/search?tags=(story,comment)&query=",
  favicon: getDuckduckgoFaviconUrl("https://news.ycombinator.com"),
}

completions.hn.callback = (response) => {
  const res = JSON.parse(response.text)
  return res.hits.map((s) => {
    let title = ""
    let prefix = ""
    if (s.points) {
      prefix += `[↑${s.points}] `
    }
    if (s.num_comments) {
      prefix += `[↲${s.num_comments}] `
    }
    switch (s._tags[0]) {
    case "story":
      title = s.title
      break
    case "comment":
      title = s.comment_text
      break
    default:
      title = s.objectID
    }
    const url = `https://news.ycombinator.com/item?id=${encodeURIComponent(
      s.objectID,
    )}`
    return suggestionItem({ url })`
      <div>
        <div class="title">${prefix}${title}</div>
        <div class="url">${url}</div>
      </div>
    `
  })
}

// Twitter
completions.tw = {
  alias:  "tw",
  name:   "twitter",
  search: "https://twitter.com/search?q=",
  compl:  "https://duckduckgo.com/ac/?q=twitter%20",
}

completions.tw.callback = (response, { query }) => {
  const results = JSON.parse(response.text).map((r) => {
    const q = r.phrase.replace(/^twitter /, "")
    return urlItem(q, `https://twitter.com/search?q=${encodeURIComponent(q)}`)
  })
  if (query.length >= 2 && query.match(/^@/)) {
    results.unshift(
      urlItem(
        query,
        `https://twitter.com/${encodeURIComponent(query.replace(/^@/, ""))}`,
      ),
    )
  }
  return results
}

// Reddit
completions.re = {
  alias:  "re",
  name:   "reddit",
  search: "https://www.reddit.com/search?sort=relevance&t=all&q=",
  compl:
    "https://api.reddit.com/search?syntax=plain&sort=relevance&limit=20&q=",
}

completions.re.thumbs = {
  default: "https://i.imgur.com/VCm94xa.png",
  image:   "https://i.imgur.com/OaAUUaQ.png",
  nsfw:    "https://i.imgur.com/lnmJrXP.png",
  self:    "https://i.imgur.com/KQ8uYZz.png",
  spoiler: "https://i.imgur.com/gx2tGsv.png",
}

completions.re.callback = async (response, { query }) => {
  const [_, sub, __, q = ""] = query.match(
    /^\s*\/?(r\/[a-zA-Z0-9_]+)(\s+(.*))?/,
  ) ?? [null, null, null, query]
  if (sub && q) {
    response = {
      text: await runtimeHttpRequest(
        `https://api.reddit.com/${encodeURIComponent(
          sub,
        )}/search?syntax=plain&sort=relevance&restrict_sr=on&limit=20&q=${encodeURIComponent(
          q,
        )}`,
      ),
    }
  } else if (sub) {
    const res = await runtimeHttpRequest(
      `https://www.reddit.com/api/search_reddit_names.json?typeahead=true&exact=false&query=${encodeURIComponent(
        sub,
      )}`,
    )
    return JSON.parse(res).names.map((name) =>
      urlItem(`r/${name}`, `https://reddit.com/r/${encodeURIComponent(name)}`, {
        query: `r/${name}`,
      }))
  }
  return JSON.parse(response.text).data.children.map(({ data }) => {
    const thumb = data.thumbnail?.match(/^https?:\/\//)
      ? data.thumbnail
      : completions.re.thumbs[data.thumbnail]
        ?? completions.re.thumbs.default
    const relDate = prettyDate(new Date(parseInt(data.created, 10) * 1000))
    return suggestionItem({
      url: encodeURI(`https://reddit.com${data.permalink}`),
    })`
      <div style="display: flex; flex-direction: row">
        <img style="width: 70px; height: 50px; margin-right: 0.8em" alt="thumbnail" src="${thumb}">
        <div>
          <div>
            <strong><span style="font-size: 1.2em; margin-right: 0.2em">↑</span>${
  data.score
}</strong> ${
  data.title
} <span style="font-size: 0.8em; opacity: 60%">(${data.domain})</span>
          </div>
          <div>
            <span style="font-size: 0.8em"><span style="color: opacity: 70%">r/${
  data.subreddit
}</span> • <span style="color: opacity: 70%">${
  data.num_comments ?? "unknown"
}</span> <span style="opacity: 60%">comments</span> • <span style="opacity: 60%">submitted ${relDate} by</span> <span style="color: opacity: 70%">${
  data.author
}</span></span>
          </div>
        </div>
      </div>
    `
  })
}

// YouTube
completions.yt = {
  alias:  "yt",
  name:   "youtube",
  search: "https://www.youtube.com/search?q=",
  compl:  `https://www.googleapis.com/youtube/v3/search?maxResults=20&part=snippet&type=video,channel&key=${priv.keys.google_yt}&safeSearch=none&q=`,
  priv:   true,
}

completions.yt.callback = (response) =>
  JSON.parse(response.text)
    .items.map((s) => {
      const thumb = s.snippet.thumbnails.default
      switch (s.id.kind) {
      case "youtube#channel":
        return suggestionItem({
          url: `https://youtube.com/channel/${s.id.channelId}`,
        })`
          <div style="display: flex; flex-direction: row">
            <img style="${`width: ${thumb.width ?? 120}px; height: ${
    thumb.height ?? 90
  }px; margin-right: 0.8em`}" alt="thumbnail" src="${thumb.url}">
            <div>
              <div>
                <strong>${s.snippet.channelTitle}</strong>
              </div>
              <div>
                <span>${s.snippet.description}</span>
              </div>
              <div>
                <span style="font-size: 0.8em"><span style="opacity: 70%">channel</span></span>
              </div>
            </div>
          </div>
        `
      case "youtube#video":
        const relDate = prettyDate(new Date(s.snippet.publishTime))
        return suggestionItem({
          url: `https://youtu.be/${encodeURIComponent(s.id.videoId)}`,
        })`
          <div style="display: flex; flex-direction: row">
            <img style="${`width: ${thumb.width ?? 120}px; height: ${
    thumb.height ?? 90
  }px; margin-right: 0.8em`}" alt="thumbnail" src="${thumb.url}">
            <div>
              <div>
                <strong>${htmlPurify(s.snippet.title)}</strong>
              </div>
              <div>
                <span>${htmlPurify(s.snippet.description)}</span>
              </div>
              <div>
                <span style="font-size: 0.8em"><span style="opacity: 70%">video</span> <span style="opacity: 60%">by</span> <span style="opacity: 70%">${
  s.snippet.channelTitle
}</span> • <span style="opacity: 70%">${relDate}</span></span>
              </div>
            </div>
          </div>
        `
      default:
        return null
      }
    })
    .filter((s) => !!s)

// Huggingface
completions.hf = {
  alias:  "hf",
  name:   "huggingface",
  search: "https://huggingface.co/models?search=",
  // type must be one of [model, dataset, space, org, user, paper, collection]
  compl:  "https://huggingface.co/api/quicksearch?q=",
}

completions.hf.callback = (response) => {
  const res = JSON.parse(response.text)
  // return [
  return [
    ...res.models.map(
      (m) =>
        suggestionItem({
          url: `https://huggingface.co/${m.id}`,
        })`
        <div>
          <div><strong>${m.id}</strong></div>
          <div><span style="font-size: 0.9em; opacity: 70%">model</span></div>
        </div>
     `,
    ),
    ...res.datasets.map(
      (d) =>
        suggestionItem({
          url: `https://huggingface.co/datasets/${d.id}`,
        })`
        <div>
          <div><strong>${d.id}</strong></div>
          <div><span style="font-size: 0.9em; opacity: 70%">dataset</span></div>
        </div>
     `,
    ),
  ]
}

export default completions
