# Pornpics javascript crawler

pornpics javascript crawler is a node module that allows you to crawl [pornpics.com](https://pornpics.com) and save picture automatically.

## Features
- Fetch gallery informations
- Fetch category galleries
- Save gallery
- Save category

## Installation

Install globally
```bash
npm i -g pornpics
or
yarn global add pornpics
```

Install localy
```bash
npm i pornpics
or
yarn add pornpics
```

## CLI usage (global)

```bash
pornpics <category_url|gallery_url> <dest>
```

Example:
```bash
pornpics https://www.pornpics.com/ass/ pictures
```

### Options

#### `-a, --aggregate` no subdirectories (bool, default: false)

Downloads all pictures into the same directory regardless of which gallery it belongs to.

#### `-p, --page <n>` starting page (int, default: 1)

Specifies which page should the crawler start at.

#### `-l, --limit <n>` (int, default: 1)

Specifies how many pages should the crawler crawl.

#### `-c, --cover` (bool, default: false)

Only downloads gallery covers. *It only works with categories.*

## API (local)

Basic example

```javascript
const Pornpics = require('pornpics-crawler')
const crawler = new Pornpics({
  url: 'https://www.pornpics.com/ass/',
  page: 1,
  limit: 1,
  dest: 'dest',
  aggregate: true,
  cover: false
})

crawler.on('error', err => {
  console.error(err)
})

// Fires when a gallery has been successfully fetched
crawler.on('downloaded', gallery => {
  console.log(`'${gallery.title}' gallery fetched`) // gallery picture links are in gallery.pictures
})

crawler.on('download-end', _ => {
  console.log(`crawl has ended`)
})
```

### Constructor options

#### `url` (required, string)

The url of the desired category or gallery.

#### `page` (int, default: 1)

The page the crawler will start at.

#### `limit` (int, default: 1)

The amount of pages the crawler will crawl.

#### `dest` (string, default: null)

The destination directory if you want to save the crawled pictures. If no `dest` option is provided, no picture will be saved.

#### `aggregate` (bool, default: false)

If `dest` option is provided and if `aggregate` is true, all pictures will be downloaded into the same directory regardless of which gallery it belongs to.

#### `cover` (bool, default: false)

If `dest` option is provided and if `cover` is true, the crawler will only save gallery covers. *It only works with categories.*

### Events

#### `fetch` (gallery)

Fires when a gallery has been crawled.

#### `end`

Fires when crawl has ended.

#### `downloaded` (gallery)

Fires when a gallery has been downloaded.

#### `download-end`

Fires when crawl download has ended.
