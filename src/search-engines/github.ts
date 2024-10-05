const { suggestionItem } = util
import util from "../util"

type GithubCompResult = {
  items: {
    full_name: string
    stargazers_count?: number
    html_url: string
  }[]
}

export const gh = {
  alias: "gh",
  name: "github",
  searchUrl: "https://github.com/search?q=%s",
  compUrl:
    "https://api.github.com/search/repositories?sort=stars&order=desc&q=%s",
  compFn: (res) =>
    (JSON.parse(res.text) as GithubCompResult).items.map((item) => {
      let title = ""
      if (item.stargazers_count) {
        title += `${item.stargazers_count}⭐ `
      }
      title += item.full_name

      return suggestionItem({ url: item.html_url })` <div>
        <div style="font-weight: bold">${title}</div>
        <div style="opacity: 0.7; line-height: 1.3em">${item.html_url}</div>
      </div>`
    }),
  faviconUrl: "https://github.com/favicon.ico",
}
