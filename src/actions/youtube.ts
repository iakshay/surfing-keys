import { getMarkdownLink } from "./global"
// youtube.com
const yt = {
  getCurrentTimestamp: () => {
    const [ss, mm, hh = 0] = document
      .querySelector("#ytd-player .ytp-time-current")
      ?.innerText?.split(":")
      ?.reverse()
      ?.map(Number) ?? [0, 0, 0]
    return [ss, mm, hh]
  },

  getCurrentTimestampSeconds: () => {
    const [ss, mm, hh] = yt.getCurrentTimestamp()
    return hh * 60 * 60 + mm * 60 + ss
  },

  getCurrentTimestampHuman: () => {
    const [ss, mm, hh] = yt.getCurrentTimestamp()
    const pad = (n) => `${n}`.padStart(2, "0")
    return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`
  },

  getShortLink: () => {
    const params = new URLSearchParams(window.location.search)
    return `https://youtu.be/${params.get("v")}`
  },

  getCurrentTimestampLink: () =>
    `${yt.getShortLink()}?t=${yt.getCurrentTimestampSeconds()}`,

  getCurrentTimestampMarkdownLink: () =>
    getMarkdownLink({
      title: `${
        document.querySelector("#ytd-player .ytp-title").innerText
      } @ ${yt.getCurrentTimestampHuman()} - YouTube`,
      href: yt.getCurrentTimestampLink(),
    }),
}

export default yt;
