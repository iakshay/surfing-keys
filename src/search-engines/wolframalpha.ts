import priv from "../conf.priv"
import util from "../util"
const { htmlNode, htmlForEach, suggestionItem } = util
// WolframAlpha
export const wa = {
  alias: "wa",
  name: "wolframalpha",
  search: "http://www.wolframalpha.com/input/?i=",
  compl: `http://api.wolframalpha.com/v2/query?appid=${priv.keys.wolframalpha}&format=plaintext,image&output=json&reinterpret=true&input=%s`,
  priv: true,
}

wa.callback = (response, { query }) => {
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
          `
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
      title: p.title,
      values: [],
      url: `http://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`,
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
      </div>`
  )
}
