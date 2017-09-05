/* eslint-env mocha */
const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const chai = require('chai')
const { assert } = chai
const rmdir = require('rimraf')
const sinon = require('sinon')

const Pornpics = require('..')

describe('Pornpics', _ => {
  it('should throw on 404 errors', done => {
    const crawler = new Pornpics()
    crawler.crawl({
      url: 'https://www.pornpics.com/404'
    })

    crawler.on('error', err => {
      assert(err.name, 'StatusCodeError')
      assert(err.statusCode, 404)
      done()
    })
  })

  describe('#galleries', _ => {
    it('should crawl gallery informations', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/galleries/teen-girls-keisha-and-natalie-throw-an-all-lesbian-pool-party/'
      })

      crawler.on('fetch', gallery => {
        assert.isString(gallery.title)
        assert.isArray(gallery.pictures)
      })

      crawler.on('end', done)

      crawler.on('error', err => { throw err })
    })
  })

  describe('#categories', _ => {
    it('should crawl gallery', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/ass/'
      })
      sinon.spy(crawler, 'scanGallery')

      crawler.on('fetch', gallery => {
        assert.isString(gallery.title)
        assert.isString(gallery.cover)
        assert.isArray(gallery.pictures)
      })

      crawler.on('end', _ => {
        assert.equal(crawler.scanGallery.callCount, 20, 'callCount is equal to 20')
        done()
      })

      crawler.on('error', err => { throw err })
    })

    it('should crawl gallery with a custom start page and limit', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/ass/',
        page: 3,
        limit: 2
      })
      sinon.spy(crawler, 'scanGallery')

      crawler.on('fetch', gallery => {
        assert.isString(gallery.title)
        assert.isString(gallery.cover)
        assert.isArray(gallery.pictures)
      })

      crawler.on('end', _ => {
        assert.equal(crawler.scanGallery.callCount, 40, 'callCount is equal to 40')
        done()
      })

      crawler.on('error', err => { throw err })
    })
  })

  describe('#save', _ => {
    const dest = `${__dirname}/tmp`

    afterEach(done => {
      rmdir(dest, done)
    })

    it('should save gallery pictures', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/galleries/teen-girls-keisha-and-natalie-throw-an-all-lesbian-pool-party/',
        dest
      })

      crawler.on('downloaded', gallery => {
        assert.isString(gallery.title)
        assert.isArray(gallery.pictures)
      })

      crawler.on('download-end', async _ => {
        const files = await fs.readdirAsync(dest)
        assert.isAtLeast(files.length, 1)
        done()
      })

      crawler.on('error', err => { throw err })
    })

    it('should save category pictures', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/ass/',
        dest
      })

      crawler.on('downloaded', gallery => {
        assert.isString(gallery.title)
        assert.isArray(gallery.pictures)
      })

      crawler.on('download-end', async _ => {
        const files = await fs.readdirAsync(dest)
        assert.isAtLeast(files.length, 1)
        done()
      })

      crawler.on('error', err => { throw err })
    })

    it('should save category covers', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/ass/',
        dest,
        cover: true
      })

      crawler.on('downloaded', gallery => {
        assert.isString(gallery.title)
        assert.isArray(gallery.pictures)
      })

      crawler.on('download-end', async _ => {
        const files = await fs.readdirAsync(dest)
        assert.isAtLeast(files.length, 1)
        done()
      })

      crawler.on('error', err => { throw err })
    })

    it('should save category pictures and aggregate', done => {
      const crawler = new Pornpics()
      crawler.crawl({
        url: 'https://www.pornpics.com/ass/',
        dest,
        aggregate: true
      })

      crawler.on('downloaded', gallery => {
        assert.isString(gallery.title)
        assert.isArray(gallery.pictures)
      })

      crawler.on('download-end', async _ => {
        const files = await fs.readdirAsync(dest)
        assert.isAtLeast(files.length, 1)
        done()
      })

      crawler.on('error', err => { throw err })
    })
  })
})
