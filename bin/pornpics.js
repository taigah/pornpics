#!/usr/bin/env node

const Pornpics = require('..')
const program = require('commander')
const { assert } = require('chai')
require('colors')

program.version(require('../package').version)
.description('Download a pornpics.com category or gallery')
.usage('[options] <category_url|gallery_url> <dest>')
.option('-a, --aggregate', 'Downloads all pictures into the same directory regardless of which gallery it belongs to.')
.option('-p, --page <n>', 'Starting page (category)', parseInt)
.option('-l, --limit <n>', 'Number of pages to crawl', parseInt)
.option('-c, --cover', 'Only downloads cover (category)')
.parse(process.argv)

const [ url, dest ] = program.args

if (program.args.length === 0) {
  program.outputHelp()
  process.exit(0)
}

const aggregate = program.aggregate || false
const page = program.page || 1
const limit = program.limit || 1
const cover = program.cover || false

assert(url, 'url argument is required')
assert(dest, 'dest argument is required')

const crawler = new Pornpics({ url, dest, aggregate, page, limit, cover })

let galleryCount = 0
let pictureCount = 0

crawler.on('downloaded', gallery => {
  galleryCount++
  pictureCount += gallery.pictures.length
  console.log(`'${gallery.title}' downloaded...`.green)
})

crawler.on('download-end', _ => {
  console.log(`${galleryCount} galleries downloaded`.blue)
  console.log(`${pictureCount} pictures downloaded`.blue)
})
