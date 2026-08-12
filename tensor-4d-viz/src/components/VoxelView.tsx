import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { indexOf, type Tensor4D } from '../lib/tensorMath'
import { valueColor } from '../lib/colorMap'
import type { PointerPosition } from '../hooks/useHighlight'

interface Props {
  tensor: Tensor4D
  batch: number
  highlightedIndex: number | null
  onHover: (index: number | null, pointer?: PointerPosition) => void
  onSelect: (index: number) => void
}

export function VoxelView({ tensor, batch, highlightedIndex, onHover, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const [_, H, W, C] = tensor.shape
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b1018')
    scene.fog = new THREE.Fog('#0b1018', 18, 38)
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 100)
    const longest = Math.max(H, W, C)
    camera.position.set(longest * 1.25, longest * 1.05, longest * 1.45)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)
    controls.update()
    const group = new THREE.Group()
    group.rotation.y = 0.18
    scene.add(group)

    const geometry = new THREE.BoxGeometry(0.78, 0.78, 0.78)
    const material = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.08 })
    const mesh = new THREE.InstancedMesh(geometry, material, H * W * C)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    let instance = 0
    for (let h = 0; h < H; h += 1) {
      for (let w = 0; w < W; w += 1) {
        for (let c = 0; c < C; c += 1) {
          const flatIndex = indexOf(tensor.shape, batch, h, w, c)
          const scale = highlightedIndex === flatIndex ? 1.28 : 1
          matrix.compose(
            new THREE.Vector3(w - (W - 1) / 2, (H - 1) / 2 - h, c - (C - 1) / 2),
            new THREE.Quaternion(),
            new THREE.Vector3(scale, scale, scale),
          )
          mesh.setMatrixAt(instance, matrix)
          mesh.setColorAt(instance, color.set(valueColor(tensor.data[flatIndex], c)))
          instance += 1
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    group.add(mesh)
    scene.add(new THREE.AmbientLight('#9ab8ff', 1.6))
    const key = new THREE.DirectionalLight('#ffffff', 3.2)
    key.position.set(6, 8, 7)
    scene.add(key)
    const rim = new THREE.DirectionalLight('#6677ff', 2.4)
    rim.position.set(-6, -3, -5)
    scene.add(rim)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(mesh)[0]
      if (hit?.instanceId === undefined) return null
      const local = hit.instanceId
      const h = Math.floor(local / (W * C))
      const remainder = local % (W * C)
      const w = Math.floor(remainder / C)
      const c = remainder % C
      return indexOf(tensor.shape, batch, h, w, c)
    }
    const handleMove = (event: PointerEvent) => {
      const index = pick(event)
      renderer.domElement.style.cursor = index === null ? 'grab' : 'pointer'
      onHover(index, index === null ? undefined : { x: event.clientX, y: event.clientY })
    }
    const handleLeave = () => onHover(null)
    const handleClick = (event: PointerEvent) => {
      const index = pick(event)
      if (index !== null) onSelect(index)
    }
    renderer.domElement.addEventListener('pointermove', handleMove)
    renderer.domElement.addEventListener('pointerleave', handleLeave)
    renderer.domElement.addEventListener('click', handleClick)

    const resizeObserver = new ResizeObserver(() => {
      const width = host.clientWidth
      const height = host.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    })
    resizeObserver.observe(host)
    let frame = 0
    const animate = () => {
      group.rotation.y *= 0.94
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointermove', handleMove)
      renderer.domElement.removeEventListener('pointerleave', handleLeave)
      renderer.domElement.removeEventListener('click', handleClick)
      controls.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [batch, highlightedIndex, onHover, onSelect, tensor])

  return (
    <div
      className="voxel-view"
      ref={hostRef}
      role="img"
      aria-label={`Interactive 3D voxel grid for batch ${batch}, ${tensor.shape[1]} by ${tensor.shape[2]} by ${tensor.shape[3]}. Drag to rotate, scroll to zoom, and click a voxel to edit.`}
    />
  )
}
