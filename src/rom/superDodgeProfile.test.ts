import { describe, expect, it } from 'vitest'
import { decode4bppAtlas, decodeOamEntry, decodePalette, parseHeader, type AtlasDefinition } from './superDodgeProfile'

describe('Super Dodgeball ROM profile', () => {
  it('parses and validates the GBA header checksum', () => {
    const bytes = new Uint8Array(0xc0)
    bytes.set(new TextEncoder().encode('SUPERDODGE'), 0xa0)
    bytes.set(new TextEncoder().encode('ADFE'), 0xac)
    bytes.set(new TextEncoder().encode('EB'), 0xb0)
    let checksum = 0
    for (let offset = 0xa0; offset < 0xbd; offset += 1) checksum = (checksum - bytes[offset]) & 0xff
    bytes[0xbd] = (checksum - 0x19) & 0xff
    expect(parseHeader(bytes.buffer)).toEqual({
      title: 'SUPERDODGE', gameCode: 'ADFE', makerCode: 'EB', revision: 0, checksumValid: true,
    })
  })

  it('decodes GBA BGR555 colors and makes color zero transparent', () => {
    const bytes = new Uint8Array(32)
    new DataView(bytes.buffer).setUint16(2, 0x001f, true)
    expect(decodePalette(bytes.buffer, 0)[0][3]).toBe(0)
    expect(decodePalette(bytes.buffer, 0)[1]).toEqual([255, 0, 0, 255])
  })

  it('decodes low and high nibbles in 4 bpp tile order', () => {
    const bytes = new Uint8Array(96)
    const view = new DataView(bytes.buffer)
    view.setUint16(2, 0x001f, true)
    view.setUint16(4, 0x03e0, true)
    bytes.fill(0x21, 32, 64)
    const atlas: AtlasDefinition = { bank: 'a', romOffset: 32, byteSize: 32, width: 8, height: 8, frameCount: 0 }
    const pixels = decode4bppAtlas(bytes.buffer, atlas, 0)
    expect([...pixels.slice(0, 8)]).toEqual([255, 0, 0, 255, 0, 255, 0, 255])
  })

  it('decodes signed coordinates and dimensions from GBA OAM attributes', () => {
    const entry = decodeOamEntry(0x00e0, 0x81e8, 0)
    expect(entry).toMatchObject({ x: -24, y: -32, width: 32, height: 32, tileIndex: 0 })
  })
})
