export const EXPECTED_ROM_SIZE = 4 * 1024 * 1024
export const EXPECTED_ROM_SHA256 = '4a66b812a0ab885ab11c0b9c5666084a3c4d013edcb1924100ed80e6881f205a'
export const ROM_BASE = 0x08000000
export const ASSET_TABLE_OFFSET = 0x36983c
export const ASSET_TABLE_COUNT = 1211
export const RUNTIME_TEAM_TABLE_OFFSET = 0x36b0c0

export interface RomHeader {
  title: string
  gameCode: string
  makerCode: string
  revision: number
  checksumValid: boolean
}

export interface AtlasDefinition {
  bank: 'a' | 'b' | 'c'
  romOffset: number
  byteSize: number
  width: number
  height: number
  frameCount: number
}

export interface TeamAssetDefinition {
  teamIndex: number
  palettes: { variantA: number; variantB: number }
  animationBankMapping: number[]
  atlases: AtlasDefinition[]
  runtime: RuntimeTeamDefinition
}

export interface TransferDescriptor {
  sourceA: number
  sourceB: number
  value: number
}

export interface RuntimeTeamDefinition {
  tableOffset: number
  columnOffsets: [number, number, number, number]
  graphicsBankMap: number[]
  primaryRecordMap: number[]
  secondaryRecordMap: number[]
  transferDescriptors: TransferDescriptor[]
}

export interface RuntimeOamEntry {
  index: number
  x: number
  y: number
  width: number
  height: number
  tileIndex: number
  paletteBank: number
  priority: number
  hflip: boolean
  vflip: boolean
  attr0: number
  attr1: number
  attr2: number
}

export interface RuntimePose {
  index: number
  oamEntries: RuntimeOamEntry[]
  offsetX: number
  offsetY: number
  value2: number
  value3: number
}

export interface RuntimeSequenceFrame {
  index: number
  pose: number
  duration: number
}

export interface RuntimeAnimationState {
  stateIndex: number
  graphicsBankOffset: number
  frames: RuntimeSequenceFrame[]
  poses: RuntimePose[]
  totalDuration: number
}

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  new TextDecoder('ascii').decode(bytes.subarray(start, end)).replace(/\0.*$/, '').trim()

const u32 = (view: DataView, offset: number) => view.getUint32(offset, true)
const i32 = (view: DataView, offset: number) => view.getInt32(offset, true)

const checksum = (bytes: Uint8Array) => {
  let value = 0
  for (let offset = 0xa0; offset < 0xbd; offset += 1) value = (value - bytes[offset]) & 0xff
  return (value - 0x19) & 0xff
}

export function parseHeader(buffer: ArrayBuffer): RomHeader {
  const bytes = new Uint8Array(buffer)
  if (bytes.byteLength < 0xc0) throw new Error('Fichier trop court pour être une ROM GBA.')
  return {
    title: ascii(bytes, 0xa0, 0xac),
    gameCode: ascii(bytes, 0xac, 0xb0),
    makerCode: ascii(bytes, 0xb0, 0xb2),
    revision: bytes[0xbc],
    checksumValid: bytes[0xbd] === checksum(bytes),
  }
}

export async function sha256(buffer: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyRom(buffer: ArrayBuffer) {
  const header = parseHeader(buffer)
  if (buffer.byteLength !== EXPECTED_ROM_SIZE) throw new Error(`Taille inattendue : ${buffer.byteLength} octets.`)
  if (header.title !== 'SUPERDODGE' || header.gameCode !== 'ADFE') {
    throw new Error(`ROM incompatible : ${header.title || 'sans titre'} / ${header.gameCode || 'sans code'}.`)
  }
  if (!header.checksumValid) throw new Error("La somme de contrôle de l'en-tête est invalide.")
  const digest = await sha256(buffer)
  if (digest !== EXPECTED_ROM_SHA256) {
    throw new Error('Cette révision ou ce patch ne correspond pas au profil analysé.')
  }
  return { header, digest }
}

function assetTable(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  const values: number[] = []
  for (let index = 0; index < ASSET_TABLE_COUNT; index += 1) {
    const address = u32(view, ASSET_TABLE_OFFSET + index * 4)
    const offset = address - ROM_BASE
    if (offset < 0 || offset >= buffer.byteLength) throw new Error(`Pointeur de ressource invalide à l'index ${index}.`)
    values.push(offset)
  }
  return values
}

function pointerTable(buffer: ArrayBuffer, offset: number, count: number) {
  const view = new DataView(buffer)
  const values: number[] = []
  for (let index = 0; index < count; index += 1) {
    const romOffset = u32(view, offset + index * 4) - ROM_BASE
    if (romOffset < 0 || romOffset >= buffer.byteLength) throw new Error(`Pointeur ROM invalide à 0x${(offset + index * 4).toString(16)}.`)
    values.push(romOffset)
  }
  return values
}

function pointerAt(view: DataView, offset: number) {
  const romOffset = u32(view, offset) - ROM_BASE
  if (romOffset < 0 || romOffset >= view.byteLength) throw new Error(`Pointeur ROM invalide à 0x${offset.toString(16)}.`)
  return romOffset
}

const wrappedSigned = (value: number, bits: number) => {
  const sign = 1 << (bits - 1)
  return value & sign ? value - (1 << bits) : value
}

export function decodeOamEntry(attr0: number, attr1: number, attr2: number, index = 0): RuntimeOamEntry {
  const shape = (attr0 >> 14) & 3
  const size = (attr1 >> 14) & 3
  const dimensions = [
    [[8, 8], [16, 16], [32, 32], [64, 64]],
    [[16, 8], [32, 8], [32, 16], [64, 32]],
    [[8, 16], [8, 32], [16, 32], [32, 64]],
    [[0, 0], [0, 0], [0, 0], [0, 0]],
  ] as const
  const [width, height] = dimensions[shape][size]
  const affine = Boolean(attr0 & 0x0100)
  return {
    index,
    x: wrappedSigned(attr1 & 0x01ff, 9),
    y: wrappedSigned(attr0 & 0x00ff, 8),
    width,
    height,
    tileIndex: attr2 & 0x03ff,
    paletteBank: (attr2 >> 12) & 0x0f,
    priority: (attr2 >> 10) & 3,
    hflip: affine ? false : Boolean(attr1 & 0x1000),
    vflip: affine ? false : Boolean(attr1 & 0x2000),
    attr0,
    attr1,
    attr2,
  }
}

function runtimeTeam(buffer: ArrayBuffer, teamIndex: number): RuntimeTeamDefinition {
  const tableOffset = RUNTIME_TEAM_TABLE_OFFSET + teamIndex * 16
  const columnOffsets = pointerTable(buffer, tableOffset, 4) as [number, number, number, number]
  const view = new DataView(buffer)
  const transferDescriptors: TransferDescriptor[] = []
  for (let index = 0; index < 8; index += 1) {
    const offset = columnOffsets[3] + index * 12
    transferDescriptors.push({
      sourceA: u32(view, offset) - ROM_BASE,
      sourceB: u32(view, offset + 4) - ROM_BASE,
      value: u32(view, offset + 8),
    })
  }
  return {
    tableOffset,
    columnOffsets,
    graphicsBankMap: pointerTable(buffer, columnOffsets[0], 60),
    primaryRecordMap: pointerTable(buffer, columnOffsets[1], 60),
    secondaryRecordMap: pointerTable(buffer, columnOffsets[2], 60),
    transferDescriptors,
  }
}

export function teamAssets(buffer: ArrayBuffer, teamIndex: number): TeamAssetDefinition {
  if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex >= 15) throw new Error("L'index d'équipe doit être compris entre 0 et 14.")
  const table = assetTable(buffer)
  const mappingStart = 189 + teamIndex * 60
  const animationBankMapping = table.slice(mappingStart, mappingStart + 60)
  const banks = [...new Set(animationBankMapping)]
  if (banks.length !== 3 || banks[1] - banks[0] !== 0x7000 || banks[2] - banks[1] !== 0x7000) {
    throw new Error(`Structure graphique inattendue pour l'équipe ${teamIndex}.`)
  }
  return {
    teamIndex,
    palettes: { variantA: table[30 + teamIndex], variantB: table[15 + teamIndex] },
    animationBankMapping,
    runtime: runtimeTeam(buffer, teamIndex),
    atlases: [
      { bank: 'a', romOffset: banks[0], byteSize: 0x7000, width: 256, height: 224, frameCount: 56 },
      { bank: 'b', romOffset: banks[1], byteSize: 0x7000, width: 256, height: 224, frameCount: 56 },
      { bank: 'c', romOffset: banks[2], byteSize: 0x3000, width: 256, height: 96, frameCount: 24 },
    ],
  }
}

export function animationStates(buffer: ArrayBuffer, teamIndex: number): RuntimeAnimationState[] {
  const team = teamAssets(buffer, teamIndex)
  const view = new DataView(buffer)
  return team.runtime.primaryRecordMap.map((descriptorOffset, stateIndex) => {
    const oamSetOffset = pointerAt(view, descriptorOffset)
    const sequenceOffset = pointerAt(view, descriptorOffset + 4)
    const framesOffset = pointerAt(view, sequenceOffset)
    const frameCount = u32(view, sequenceOffset + 4)
    if (frameCount === 0 || frameCount > 256) throw new Error(`Séquence incohérente pour l'état ${stateIndex}.`)
    const frames: RuntimeSequenceFrame[] = []
    for (let index = 0; index < frameCount; index += 1) {
      frames.push({
        index,
        pose: view.getUint16(framesOffset + index * 4, true),
        duration: view.getUint16(framesOffset + index * 4 + 2, true),
      })
    }
    const poseCount = Math.max(...frames.map((frame) => frame.pose)) + 1
    const metadataOffset = team.runtime.secondaryRecordMap[stateIndex]
    const metadataRecordsOffset = pointerAt(view, metadataOffset)
    const poses: RuntimePose[] = []
    for (let poseIndex = 0; poseIndex < poseCount; poseIndex += 1) {
      const oamDescriptorOffset = oamSetOffset + poseIndex * 8
      const oamEntriesOffset = pointerAt(view, oamDescriptorOffset)
      const oamCount = u32(view, oamDescriptorOffset + 4)
      if (oamCount > 128) throw new Error(`Liste OAM incohérente pour l'état ${stateIndex}.`)
      const oamEntries: RuntimeOamEntry[] = []
      for (let entryIndex = 0; entryIndex < oamCount; entryIndex += 1) {
        const offset = oamEntriesOffset + entryIndex * 8
        oamEntries.push(decodeOamEntry(
          view.getUint16(offset, true),
          view.getUint16(offset + 2, true),
          view.getUint16(offset + 4, true),
          entryIndex,
        ))
      }
      const metadata = metadataRecordsOffset + poseIndex * 16
      poses.push({
        index: poseIndex,
        oamEntries,
        offsetX: i32(view, metadata),
        offsetY: i32(view, metadata + 4),
        value2: i32(view, metadata + 8),
        value3: i32(view, metadata + 12),
      })
    }
    return {
      stateIndex,
      graphicsBankOffset: team.runtime.graphicsBankMap[stateIndex],
      frames,
      poses,
      totalDuration: frames.reduce((sum, frame) => sum + frame.duration, 0),
    }
  })
}

export function decodePalette(buffer: ArrayBuffer, offset: number) {
  const view = new DataView(buffer)
  const colors: Array<[number, number, number, number]> = []
  for (let index = 0; index < 16; index += 1) {
    const value = view.getUint16(offset + index * 2, true)
    colors.push([
      Math.round((value & 0x1f) * 255 / 31),
      Math.round(((value >> 5) & 0x1f) * 255 / 31),
      Math.round(((value >> 10) & 0x1f) * 255 / 31),
      index === 0 ? 0 : 255,
    ])
  }
  return colors
}

export function decode4bppAtlas(buffer: ArrayBuffer, atlas: AtlasDefinition, paletteOffset: number) {
  const bytes = new Uint8Array(buffer)
  const colors = decodePalette(buffer, paletteOffset)
  const pixels = new Uint8ClampedArray(atlas.width * atlas.height * 4)
  const tileColumns = atlas.width / 8
  const tileCount = atlas.byteSize / 32
  for (let tileIndex = 0; tileIndex < tileCount; tileIndex += 1) {
    const tileX = (tileIndex % tileColumns) * 8
    const tileY = Math.floor(tileIndex / tileColumns) * 8
    const source = atlas.romOffset + tileIndex * 32
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const packed = bytes[source + y * 4 + Math.floor(x / 2)]
        const color = colors[(packed >> (x % 2 ? 4 : 0)) & 0x0f]
        const destination = ((tileY + y) * atlas.width + tileX + x) * 4
        pixels.set(color, destination)
      }
    }
  }
  return pixels
}

export function atlasImageData(buffer: ArrayBuffer, atlas: AtlasDefinition, paletteOffset: number) {
  return new ImageData(decode4bppAtlas(buffer, atlas, paletteOffset), atlas.width, atlas.height)
}

function tilePixels(bytes: Uint8Array, sourceOffset: number, tileIndex: number, colors: ReturnType<typeof decodePalette>) {
  const pixels = new Uint8ClampedArray(8 * 8 * 4)
  const tileOffset = sourceOffset + tileIndex * 32
  if (tileOffset < 0 || tileOffset + 32 > bytes.byteLength) return pixels
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const packed = bytes[tileOffset + y * 4 + Math.floor(x / 2)]
      const color = colors[(packed >> (x % 2 ? 4 : 0)) & 0x0f]
      pixels.set(color, (y * 8 + x) * 4)
    }
  }
  return pixels
}

export function renderRuntimePose(
  buffer: ArrayBuffer,
  teamIndex: number,
  playerIndex: number,
  stateIndex: number,
  poseIndex: number,
  facing: 'a' | 'b' = 'a',
) {
  if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= 8) throw new Error("L'index de joueur doit être compris entre 0 et 7.")
  const team = teamAssets(buffer, teamIndex)
  const state = animationStates(buffer, teamIndex)[stateIndex]
  if (!state) throw new Error("État d'animation inconnu.")
  const pose = state.poses[poseIndex]
  if (!pose) throw new Error("Pose d'animation inconnue.")
  const palettes = [
    decodePalette(buffer, team.palettes.variantA),
    decodePalette(buffer, team.palettes.variantB),
  ]
  const overlay = team.runtime.transferDescriptors[playerIndex][facing === 'a' ? 'sourceA' : 'sourceB']
  const bytes = new Uint8Array(buffer)
  const width = 64
  const height = 64
  const originX = 32
  const originY = 48
  const pixels = new Uint8ClampedArray(width * height * 4)

  for (const entry of [...pose.oamEntries].reverse()) {
    const tilesWide = entry.width / 8
    const tilesHigh = entry.height / 8
    for (let tileY = 0; tileY < tilesHigh; tileY += 1) {
      for (let tileX = 0; tileX < tilesWide; tileX += 1) {
        const virtualTile = entry.tileIndex + tileY * 32 + tileX
        const useOverlay = entry.paletteBank === 1
        const sourceOffset = useOverlay ? overlay : state.graphicsBankOffset
        const sourceTile = useOverlay ? virtualTile - 0x3a0 : virtualTile
        const colors = palettes[Math.min(entry.paletteBank, 1)]
        const tile = tilePixels(bytes, sourceOffset, sourceTile, colors)
        for (let y = 0; y < 8; y += 1) {
          for (let x = 0; x < 8; x += 1) {
            const sourceX = entry.hflip ? 7 - x : x
            const sourceY = entry.vflip ? 7 - y : y
            const source = (sourceY * 8 + sourceX) * 4
            if (tile[source + 3] === 0) continue
            const destinationX = originX + entry.x + tileX * 8 + x
            const destinationY = originY + entry.y + tileY * 8 + y
            if (destinationX < 0 || destinationX >= width || destinationY < 0 || destinationY >= height) continue
            pixels.set(tile.subarray(source, source + 4), (destinationY * width + destinationX) * 4)
          }
        }
      }
    }
  }
  return { width, height, pixels, state, pose }
}
