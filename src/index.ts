import conf from "./conf"
import help from "./help"
import api from "./api"
import inlineQuery from "./inline-query"

const { categories } = help
const {
  mapkey,
  map,
  unmap,
  Clipboard,
  Front,
  removeSearchAlias,
  addSearchAlias,
} = api

type SearchEngine = {
  favicon: string
  alias: string
  name: string
  search: string
  compl: string
  callback?: (response: any) => string[]
}

export type Mapping = {
  alias: string
  category?: number
  description: string
  leader?: string
} & (
  | {
      callback: () => void
    }
  | {
      map: string
    }
)

export type Domain = string

type Aliases = Record<Domain, Domain[]>
type KeyMaps = Record<Domain, Mapping[]>

const registerKey = (domain: Domain, mapObj: Mapping, siteleader: string) => {
  const {
    alias,
    callback,
    leader = domain === "global" ? "" : siteleader,
    category = categories.misc,
    description = "",
    path = "(/.*)?",
  } = mapObj
  const opts = {}

  const key = `${leader}${alias}`

  if (domain !== "global") {
    const d = domain.replace(".", "\\.")
    opts.domain = new RegExp(`^http(s)?://(([a-zA-Z0-9-_]+\\.)*)(${d})${path}`)
  }

  const fullDescription = `#${category} ${description}`

  if (typeof mapObj.map !== "undefined") {
    map(alias, mapObj.map)
  } else {
    mapkey(key, fullDescription, callback, opts)
  }
}

const registerKeys = (maps: KeyMaps, aliases: Aliases, siteleader: string) => {
  const hydratedAliases = Object.entries(aliases).flatMap(
    ([baseDomain, aliasDomains]) =>
      aliasDomains.flatMap((a) => ({ [a]: maps[baseDomain] }))
  )

  const mapsAndAliases = Object.assign({}, maps, ...hydratedAliases)

  Object.entries(mapsAndAliases).forEach(([domain, domainMaps]) =>
    domainMaps.forEach((mapObj) => registerKey(domain, mapObj, siteleader))
  )
}

const registerSearchEngines = (
  searchEngines: SearchEngine[],
  searchleader: string
) =>
  Object.values(searchEngines).forEach((s) => {
    const options = {
      favicon_url: s.favicon,
      skipMaps: true,
    }
    addSearchAlias(
      s.alias,
      s.name,
      s.search,
      "",
      s.compl,
      s.callback,
      undefined,
      options
    )
    mapkey(`${searchleader}${s.alias}`, `#8Search ${s.name}`, () =>
      Front.openOmnibar({ type: "SearchEngine", extra: s.alias })
    )
    mapkey(
      `c${searchleader}${s.alias}`,
      `#8Search ${s.name} with clipboard contents`,
      () => {
        Clipboard.read((c) => {
          Front.openOmnibar({
            type: "SearchEngine",
            pref: c.data,
            extra: s.alias,
          })
        })
      }
    )
  })

const main = async () => {
  window.surfingKeys = api
  if (conf.settings) {
    Object.assign(
      settings,
      typeof conf.settings === "function" ? conf.settings() : conf.settings
    )
  }

  // if (conf.logLevels) {
  //   await chrome.storage.local.set({
  //     logLevels: conf.logLevels,
  //   })
  // }

  if (conf.keys && conf.keys.unmaps) {
    const { unmaps } = conf.keys
    if (unmaps.mappings) {
      unmaps.mappings.forEach((m) => unmap(m))
    }
    if (unmaps.searchAliases) {
      Object.entries(unmaps.searchAliases).forEach(([leader, items]) => {
        items.forEach((v) => removeSearchAlias(v, leader))
      })
    }
  }

  if (conf.searchEngines) {
    registerSearchEngines(
      conf.searchEngines as SearchEngine[],
      conf.searchleader ?? "o"
    )
  }

  if (conf.keys && conf.keys.maps) {
    const { keys } = conf
    const { maps, aliases = {} } = keys
    registerKeys(maps, aliases, conf.siteleader)
  }

  Front.registerInlineQuery(inlineQuery.DICT_LOOKUP)
}

if (typeof window !== "undefined") {
  main()
}
