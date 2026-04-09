export default function Head() {
  return (
    <>
      <link rel="preload" href="/models/dog.glb" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" />
      <link rel="preload" href="/models/cat.glb" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" />
      <link rel="preload" href="/hdri/brown_photostudio_02_1k.hdr" as="fetch" crossOrigin="anonymous" />
    </>
  )
}
