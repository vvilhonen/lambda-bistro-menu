'use strict'
var parse = require('./parse')
var https = require('https')

exports.handler = function(event, context, cb) {
  const now = new Date()
  parse.parse(now.getDay(), function(err, data) {
    if (err) throw err
    if (!event.channel || !event.slack) throw new Exception("No channel/slack defined")
    postToSlack(data, event.channel, event.slack, cb)
  })
}

function postToSlack(msg, channel, slackPath, done) {
  const req = https.request({
    method: 'POST',
    host: 'hooks.slack.com',
    path: slackPath,
    headers: {
      "Content-Type": 'application/json'
    }
  })

  const data = {
    text: msg.join('\n'),
    channel
  }

  console.log('Sending', JSON.stringify(data,null,2))

  req.end(JSON.stringify(data))

  req.on('response', function(res) {
    console.log("Got response "+res.statusCode)
    res.on('end', done)
  })
}
