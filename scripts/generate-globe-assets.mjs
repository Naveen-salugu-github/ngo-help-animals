/**
 * One-off generator: writes tiny low-poly GLBs into public/models for the WebGL hero.
 * Run: node scripts/generate-globe-assets.mjs
 */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReaderPolyfill {
    constructor() {
      this.result = null
      this.onloadend = null
    }
    readAsArrayBuffer(blob) {
      void Promise.resolve(blob.arrayBuffer()).then((buf) => {
        this.result = buf
        this.onloadend?.()
      })
    }
    readAsDataURL(blob) {
      void Promise.resolve(blob.arrayBuffer()).then((buf) => {
        const b64 = Buffer.from(buf).toString("base64")
        this.result = `data:application/octet-stream;base64,${b64}`
        this.onloadend?.()
      })
    }
  }
}

import { writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, "..", "public", "models")
mkdirSync(outDir, { recursive: true })

function makeTree() {
  const g = new THREE.Group()
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8f5e38, roughness: 0.92 })
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3fa06b, roughness: 0.88 })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.35, 6), trunkMat)
  trunk.position.y = 0.175
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), leafMat)
  crown.position.y = 0.48
  g.add(trunk, crown)
  g.name = "Tree"
  return g
}

function makeHouse() {
  const g = new THREE.Group()
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.9 })
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97050, roughness: 0.75 })
  const walls = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.42), wallMat)
  walls.position.y = 0.175
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.22, 4), roofMat)
  roof.position.y = 0.4
  roof.rotation.y = Math.PI / 4
  g.add(walls, roof)
  g.name = "House"
  return g
}

function makePlant() {
  const g = new THREE.Group()
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.03, 0.2, 5),
    new THREE.MeshStandardMaterial({ color: 0x6d4c32, roughness: 0.9 }),
  )
  stem.position.y = 0.1
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.1, 0.12, 6),
    new THREE.MeshStandardMaterial({ color: 0xc2785a, roughness: 0.85 }),
  )
  pot.position.y = 0.06
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.82 }),
  )
  leaf.position.y = 0.26
  leaf.scale.set(1.2, 0.9, 1.2)
  g.add(pot, stem, leaf)
  g.name = "Plant"
  return g
}

function makeCloud() {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    transparent: true,
    opacity: 0.9,
  })
  const blobs = [
    [0, 0, 0, 0.18],
    [0.16, 0.02, 0, 0.13],
    [-0.14, -0.01, 0.04, 0.12],
    [0.05, 0.06, 0.12, 0.1],
  ]
  for (const [x, y, z, s] of blobs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 5), mat)
    m.position.set(x, y, z)
    g.add(m)
  }
  g.name = "Cloud"
  return g
}

async function exportGlb(filename, object3d) {
  const scene = new THREE.Scene()
  scene.add(object3d)
  const exporter = new GLTFExporter()
  const buffer = await exporter.parseAsync(scene, { binary: true })
  const path = join(outDir, filename)
  writeFileSync(path, Buffer.from(buffer))
  console.log("Wrote", path)
}

async function main() {
  await exportGlb("tree.glb", makeTree())
  await exportGlb("house.glb", makeHouse())
  await exportGlb("plant.glb", makePlant())
  await exportGlb("cloud.glb", makeCloud())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
