'use strict'
var cp = require('child_process')
var xml2js = require('xml2js')
var _ = require('lodash')
var ss = require('simple-statistics')

const pdfToXml = exports.pdfToXml = function(file, cb) {
  if (!file) file = ''
  var data = ""
  const child = cp.exec('bash ./run.sh ' + file, function(err) {
    cb(err, data)
  })

  child.stdout.on('data', chunk => data += chunk)
}

const xmlToData = exports.xmlToData = function(xml, cb) {
  const opts = {
    strict: false
  }
  xml2js.parseString(xml, opts, function(err, json) {
    if (err) return cb(err)
    cb(null, json.PDF2XML.PAGE[0].TEXT.map(nodeToData))
  })

  function nodeToData(node) {
    return {
      text: node._,
      top: Number(node.$.TOP),
      left: Number(node.$.LEFT),
      center: Number(node.$.LEFT) + (Number(node.$.WIDTH) / 2),
      height: Number(node.$.HEIGHT)
    }
  }
}

const normalize = exports.normalize = function normalize(data) {
  const centers = data.map(i => i.center)
  const uniqCenters = _(centers).uniq().sortBy().value()
  const clusters = ss.ckmeans(uniqCenters, 8)

  const processDay = (index) => formatDayMenu(toText(combineMultilines(mapByCluster(index))))
  const processText = (index) => toText(mapByCluster(index))

  const byColumn = {
    left: processText(0),
    MONDAY: processDay(2),
    week: processText(3)[0],
    TUESDAY: processDay(4),
    WEDNESDAY: processDay(5),
    THURSDAY: processDay(6),
    FRIDAY: processDay(7)
  }

  return byColumn

  function mapByCluster(index) {
    return _(data)
      .filter(i => _.includes(clusters[index], i.center))
      .sortBy(i => i.top)
      .value()
  }

  function combineMultilines(list) {
    return list.reduce((acc, value, index) => {
      if (index < 2) return acc.concat(value)
      const last = acc[acc.length - 1]
      const heightDelta = value.top - (last.top + last.height)
      //value.text = `${heightDelta} ${value.height} ${value.text}`
      if (heightDelta < 10) {
        const newValue = Object.assign({}, value, { text: last.text + " " + value.text })
        return acc.slice(0, acc.length - 2).concat(newValue)
      }
      return acc.concat(value)
    }, [])
  }

  function formatDayMenu(list) {
    return list.map((item, index) => index === 0 ? `*${item}*` : `• ${item}`)
  }

  function toText(list) {
    return list.map(i => i.text && i.text.trim().replace(/ +/g, " "))
  }
}

const mapping = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

exports.parse = function(day, done) {
  if (day < 1 || day > 5) day = 5
  pdfToXml(null, function(err, xml) {
    if (err) return done(err)
    xmlToData(xml, function(err, data) {
      if (err) return done(err)
      const normalized = normalize(data)
      console.log(normalized)
      const forDay = normalized[mapping[day]]
      if (forDay[0].indexOf(mapping[day]) === -1) {
        done(null, ["Sorry, couldn't parse the menu, check it <http://radining.compass-usa.com/hbo/Documents/Menus/Bistro%20Web%20Menu.pdf|here>"])
      } else {
        done(null, forDay)
      }
    })
  })
}

if (!module.parent) {
  pdfToXml(process.argv[2] || '/tmp/menu.pdf', function(err, xml) {
    if (err) throw err
    xmlToData(xml, function(err, data) {
      if (err) throw err
      const d = normalize(data)
      console.log(d)
    })
  })
}
