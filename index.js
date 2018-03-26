#!/usr/bin/env node
const express = require('express')
const mcache = require('memory-cache')
const primewire = require('primewire-client')

const app = express()

const port = process.env.PORT || 19000

const requestCache = (duration) => {
	return (req, res, next) => {
		let key = `__express__${req.originalUrl}` || req.url
		let cachedBody = mcache.get(key)
		if (cachedBody) {
			res.send(cachedBody)
		} else {
			res.sendResponse = res.send
			res.send = (body) => {
				mcache.put(key, body, duration)
				res.sendResponse(body)
			}
			next()
		}
	}
}

app.get('/', (req, res) => {
	res.type('text/plain').send('PrimeFlix-Server v1.0.0')
})

app.get('/:type/popular/:genre/:page', requestCache(60 * 60 * 6), (req, res) => {
	const page = req.params.page
	const genre = req.params.genre
	const type = req.params.type
	
	function done (response) {
		if (!response) {
			res.send({ success: false, error: `Cannot fetch remote origin!` })
			return
		}
		if (genre === '') { genre = 'all' }
		res.send({ success: true, page, genre, type, data: response })
	}
	
	primewire.getItems(type, genre, page, function(success, response) {
		done(success ? response : false)
	})
})

app.get('/item/:id', requestCache(60 * 60 * 6), (req, res) => {
	const id = req.params.id
	
	function done (response) {
		if (!response) {
			res.send({ success: false, error: `Cannot fetch remote origin!` })
			return
		}
		res.send({ success: true, id, data: response })
	}
	
	primewire.getItem(id, function(success, response) {
		done(success ? response : false)
	})
})

app.get('/item/:id/season/:season/episode/:episode', requestCache(60 * 60 * 6), (req, res) => {
	const id = req.params.id
	const season = req.params.season
	const episode = req.params.episode

	function done (response) {
		if (!response) {
			res.send({ success: false, error: `Cannot fetch remote origin!` })
			return
		}
		res.send({ success: true, id, season, episode, type: 'episode', links: response })
	}

	primewire.getEpisodeLinks(id, season, episode, function(success, response) {
		done(success ? response : false)
	})
})

app.listen(port)
console.log(`Listening on: ${port}`)