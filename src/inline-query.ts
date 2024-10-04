import priv from "./conf.priv"
const DICTIONARY_API_URL = "https://dictionaryapi.com/api/v3"

const DICT_LOOKUP = {
  url: function (q) {
    const url = `${DICTIONARY_API_URL}/references/collegiate/json/${q}?key=${priv.keys.dictionary_api_key}`
    return url
  },
  parseResult: function (res) {
    try {
      const [firstResult] = JSON.parse(res.text)
      if (firstResult) {
        let definitionsList = `<ul><li>No definitions found</li></ul>`
        let pronunciationsList = `<ul><li>No pronunciations found</li></ul>`
        if (firstResult.hasOwnProperty("shortdef")) {
          const definitions = []
          for (let definition of firstResult.shortdef) {
            definitions.push(`${definition}`)
          }
          const definitionListItems = definitions.map(function (definition) {
            return `<li>${definition}</li>`
          })
          definitionsList = `<ul>${definitionListItems.join("")}</ul>`
          //TODO: Separate this function if possible
        }
        if (firstResult.hasOwnProperty("hwi")) {
          const pronunciations = []
          const resultPronunciationsArray = firstResult.hwi.prs
          if (
            resultPronunciationsArray &&
            resultPronunciationsArray.length !== 0
          ) {
            for (let i = 0; i < resultPronunciationsArray.length; i++) {
              if (resultPronunciationsArray[i].l) {
                pronunciations.push(
                  `<li>${resultPronunciationsArray[i].l} -- ${resultPronunciationsArray[i].ipa}</li>`
                )
              } else {
                pronunciations.push(
                  `<li>${resultPronunciationsArray[i].ipa}</li>`
                )
              }
            }

            pronunciationsList = `<ul>${pronunciations.join("")}</ul>`
          }
        }
        return `<h3>Pronunciations</h3>
                    ${pronunciationsList}
                    <hr/>
                    <h3>Definitions</h3>
                    ${definitionsList}
                  `
      } else {
        return `
                    <h3>This is not the definition you were looking for...</h3>
                  `
      }
    } catch (e) {
      console.log(e.message)
      return "Something bad happend... Look behind you, a three headed monkey!"
    }
  },
}

export default {
  DICT_LOOKUP,
}
