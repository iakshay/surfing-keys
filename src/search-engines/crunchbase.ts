import { suggestionItem, escapeHTML } from "../../util"

const parseCrunchbase = (response, parse) => {
  const res = JSON.parse(response.text).data.items
  if (res.length === 0) {
    return [
      suggestionItem({ url: "https://www.crunchbase.com/" })`
        <div>
          <div class="title"><strong>No Results</strong></div>
          <div class="title">Nothing matched your query</div>
        </div>`,
    ]
  }
  const objs = res.map((obj) => parse(obj))
  return objs.map((p) => {
    const domain = p.domain
      ? ` | <a href="https://${p.domain}" target="_blank">${p.domain}</a>`
      : ""
    const location = p.loc ? ` located in <em>${p.loc}</em>` : ""
    return suggestionItem({ url: p.url })`
        <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
          <img style="width:60px" src="${p.img}" alt="${p.name}">
          <div style="display:grid;grid-template-rows:1fr 1fr 0.8fr">
            <div class="title"><strong style="font-size: 1.2em">${p.name}</strong></div>
            <div class="title" style="font-size: 1.2em">${p.desc}</div>
            <div class="title"><em>${p.role}</em>${location}${domain}</div>
          </div>
        </div>`
  })
}

// Crunchbase Organization Search
const co = {
  alias: "co",
  name: "crunchbase-orgs",
  search: "https://www.crunchbase.com/textsearch?q=",
  compl: `https://api.crunchbase.com/v/3/odm_organizations?user_key=${priv.keys.crunchbase}&query=%s`,
  priv: true,
}

co.callback = (response) =>
  parseCrunchbase(response, (org) => {
    const r = org.properties
    const p = {
      name: escapeHTML(r.name),
      domain:
        r.domain !== null ? escapeHTML(r.domain).replace(/\/$/, "") : null,
      desc: escapeHTML(r.short_description),
      role: escapeHTML(r.primary_role),
      img: cbDefaultIcon,
      loc: "",
      url: `https://www.crunchbase.com/${r.web_path}`,
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
const cp = {
  alias: "cp",
  name: "crunchbase-people",
  search: "https://www.crunchbase.com/app/search/?q=",
  compl: `https://api.crunchbase.com/v/3/odm_people?user_key=${priv.keys.crunchbase}&query=%s`,
  priv: true,
}

cp.callback = (response) =>
  parseCrunchbase(response, (person) => {
    const r = person.properties
    const p = {
      name: `${escapeHTML(r.first_name)} ${escapeHTML(r.last_name)}`,
      desc: "",
      img: cbDefaultIcon,
      role: "",
      loc: "",
      url: `https://www.crunchbase.com/${r.web_path}`,
    }

    p.desc += r.title !== null ? escapeHTML(r.title) : ""
    p.desc += r.organization_name !== null && p.desc !== "" ? ", " : ""
    p.desc +=
      r.organization_name !== null ? escapeHTML(r.organization_name) : ""

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

export default { co, cp }
