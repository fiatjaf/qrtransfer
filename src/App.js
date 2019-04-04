/** @format */

import React, {useState, useEffect, useRef} from 'react'
import {render} from 'react-dom'
import {BrowserQRCodeReader, BrowserQRCodeSvgWriter} from '@zxing/library'
import useInterval from 'use-interval'

const codeReader = new BrowserQRCodeReader()
const codeWriter = new BrowserQRCodeSvgWriter()

const QRBYTES = 2000

function Reader() {
  let videoEl = useRef(null)
  let [data, setData] = useState({id: null, pieces: []})
  let [error, setError] = useState(null)

  useEffect(
    () => {
      if (!videoEl.current) return
      read()
    },
    [videoEl]
  )

  function read() {
    codeReader
      .decodeFromInputVideoDevice(undefined, 'video')
      .then(result => {
        let res = result.text
        let [id, index, total, content] = res.split('|')
        if (data.id !== id) {
          data = {id, total, pieces: {}}
        }
        data.pieces[index] = content
        if (total === Object.keys(data).length) {
          data.done = true
        }
        setData(data)
        setError(null)
      })
      .catch(err => setError(err.message))
      .then(read)
  }

  return (
    <div>
      <video id="video" width="300" height="300" ref={videoEl} />
      {error && <div>{error}</div>}
      <pre className="code">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

function Writer() {
  let [currentFile, setCurrentFile] = useState(null)

  function handleFile(e) {
    if (e.target.files.length === 0) return

    let f = e.target.files[0]
    let reader = new FileReader()
    reader.onload = e => {
      let full = reader.result
      let npieces = Math.ceil(full.length / QRBYTES)

      var pieces = []
      for (let i = 0; i < npieces; i++) {
        pieces.push(full.slice(i * QRBYTES, (i + 1) * QRBYTES))
      }

      setCurrentFile({id: 'x' + Math.random(), total: npieces, pieces})
    }

    reader.readAsDataURL(f)
  }

  return (
    <div>
      <input type="file" onChange={handleFile} />
      {currentFile && <Piece file={currentFile} />}
    </div>
  )
}

function Piece({file}) {
  let qr = useRef(null)

  let [piece, setPiece] = useState({index: 0, content: ''})

  useInterval(() => {
    let nextIndex = (piece.index + 1) % file.total
    setPiece({
      index: nextIndex,
      content: file.pieces[nextIndex]
    })
  }, 1000)

  useEffect(
    () => {
      if (!qr.current) return
      if (piece.content === '') return

      qr.current.innerHTML = ''
      codeWriter.writeToDom(
        qr.current,
        `${file.id}|${piece.index}|${file.total}|${piece.content}`,
        400,
        400
      )
    },
    [piece]
  )

  return (
    <div>
      {file.id} {piece.index + 1}/{file.total}
      <div ref={qr} />
    </div>
  )
}

function App() {
  let [tab, setTab] = useState(location.hash.slice(1) || 'writer')

  switch (tab) {
    case 'writer':
      return <Writer />
    case 'reader':
      return <Reader />
  }
}

render(<App />, document.getElementById('app'))
