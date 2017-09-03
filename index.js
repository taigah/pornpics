const fs = require('bluebird').promisifyAll(require('fs'))
const path = require('path')
const EventEmitter = require('events')

const _ = require('lodash')
const cheerio = require('cheerio')
const { assert } = require('chai')
const slug = require('slug')
const async = require('async')
const request = require('request-promise-native').defaults({
  transform: body => cheerio.load(body)
})

class Pornpics extends EventEmitter {
  constructor ({ url, page, limit, dest, aggregate, cover }) {
    super()

    this.url = url
    this.page = Math.floor(page) || 1
    this.limit = Math.floor(limit) || 1
    this.dest = dest || null
    this.aggregate = aggregate || false
    this.cover = cover || false

    this.isGallery = false

    const urlInfos = require('url').parse(this.url)

    assert(this.url, `'url' option is required`)
    assert.isString(this.url, `'url' option must be a string`)
    assert.equal(urlInfos.host, 'www.pornpics.com', `'url' option must be a pornpics.com url`)
    assert.isNumber(this.page, `'page' option must be a number`)
    assert.isAtLeast(this.page, 1, `'page' option must be at least 1`)
    assert.isNumber(this.limit, `'limit' option must be a number`)
    assert.isAtLeast(this.limit, 1, `'limit' option must be at least 1`)
    if (this.dest) assert.isString(this.dest, `'dest' option must be a string`)
    assert.isBoolean(this.aggregate, `'aggregate' option must be a boolean`)
    assert.isBoolean(this.cover, `'cover' option must be a boolean`)

    if (/^https:\/\/www\.pornpics\.com\/galleries\//.test(this.url)) {
      this.isGallery = true
    }

    this.crawlQueue = async.queue((...args) => this.scanPage(...args), 5)
    this.crawlQueue.drain = _ => {
      this.emit('end')
      if (this.downloadQueue) {
        this.downloadQueue.drain = _ => this.emit('download-end')
      }
    }

    for (let i = 0; i < this.limit; i++) {
      this.crawlQueue.push({
        url: this.url,
        page: this.page + i
      })
    }

    if (this.dest) {
      this.downloadQueue = async.queue((...args) => this.saveGallery(...args), 2)
      this.on('fetch', gallery => {
        this.downloadQueue.push(gallery)
      })
    }
  }

  async scanPage ({ url, page }, callback) {
    try {
      const $ = await request(url)
      const P_BASE = $('head').html().match(/var P_BASE = '([^']+)';/)
      if (P_BASE) {
        this.scanCategory({
          url: url,
          page: page,
          partBase: P_BASE[1]
        }, callback)
      } else if (/^https:\/\/www\.pornpics\.com\/galleries\//.test(url)) {
        this.scanGallery({ url }, callback)
      }
    } catch (err) {
      this.emit('error', err)
    }
  }

  async scanCategory ({ url, page, partBase }, callback) {
    url = page === 1 ? url : `https://www.pornpics.com/${partBase}${page}.shtml`
    try {
      const galleries = await this.getCategoryGalleries(url)
      const promises = []
      for (let gallery of galleries) {
        const promise = this.scanGallery({ url: gallery.url, cover: gallery.cover })
        promises.push(promise)
      }
      await Promise.all(promises)
      callback()
    } catch (err) {
      this.emit('error', err)
    }
  }

  async getCategoryGalleries (categoryUrl) {
    const $ = await request(categoryUrl)
    const urls = $('[class="thumbwook"] a').map((i, el) => $(el).attr('href').replace(/^.*http/, 'http')).get()
    const covers = $('[class="thumbwook"] img').map((i, el) => $(el).attr('src')).get()
    const galleries = []
    for (let i in urls) {
      galleries.push({
        url: urls[i],
        cover: covers[i]
      })
    }
    return galleries
  }

  async scanGallery ({ url, cover }, callback) {
    try {
      const $ = await request(url)
      const title = $('h1').text().trim()
      const pictures = $('#tiles [class="thumbwook"] a').map((i, el) => $(el).attr('href')).get()
      this.emit('fetch', { title, pictures, cover })
      callback && callback()
    } catch (err) {
      this.emit('error', err)
    }
  }

  async saveGallery ({ title, pictures, cover }, callback) {
    const downloadAsync = async (picture) => {
      return new Promise(async (resolve, reject) => {
        const req = require('request')(picture)
        const filename = path.parse(picture).base
        const dir = this.aggregate || this.cover || this.isGallery ? this.dest : path.join(this.dest, slug(title))
        try {
          await fs.mkdirAsync(dir)
        } catch (err) {
          if (err.code !== 'EEXIST') {
            this.emit('error', err)
          }
        }
        req.pipe(fs.createWriteStream(path.join(dir, filename)))
        req.on('end', resolve)
        req.on('error', reject)
      })
    }
    try {
      await fs.mkdirAsync(this.dest)
    } catch (err) {
      if (err.code !== 'EEXIST') {
        this.emit('error', err)
      }
    }
    try {
      if (this.cover) {
        pictures = [ cover ]
        await downloadAsync(cover)
      } else {
        for (let chunk of _.chunk(pictures, 5)) {
          await Promise.all(chunk.map(picture => downloadAsync(picture)))
        }
      }

      this.emit('downloaded', { title, pictures, cover })
    } catch (err) {
      this.emit('error', err)
    }

    callback()
  }
}

module.exports = Pornpics
