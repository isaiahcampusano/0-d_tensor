import { assertValidTensor, elementCount, validateShape, type Tensor4D, type TensorShape } from './tensorMath'

function nestedShape(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  if (!value.length) throw new Error('Nested arrays cannot be empty.')
  const childShape = nestedShape(value[0])
  for (const child of value) {
    if (JSON.stringify(nestedShape(child)) !== JSON.stringify(childShape)) throw new Error('Nested arrays must be rectangular.')
  }
  return [value.length, ...childShape]
}

function flattenNumbers(value: unknown): number[] {
  if (Array.isArray(value)) return value.flatMap(flattenNumbers)
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`Invalid numeric value: ${String(value)}`)
  return [number]
}

export function parseTensorInput(text: string): Tensor4D {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Paste JSON or CSV data first.')

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed: unknown = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      const inferred = nestedShape(parsed)
      if (inferred.length !== 4) throw new Error('Nested JSON must have exactly four dimensions: [B,H,W,C].')
      const tensor = { shape: inferred as TensorShape, data: Float32Array.from(flattenNumbers(parsed)) }
      assertValidTensor(tensor)
      return tensor
    }
    const object = parsed as { shape?: unknown; data?: unknown }
    if (!Array.isArray(object.shape) || object.shape.length !== 4 || !Array.isArray(object.data)) {
      throw new Error('JSON object must contain shape and data arrays.')
    }
    const shape = object.shape.map(Number) as TensorShape
    const tensor = { shape, data: Float32Array.from(flattenNumbers(object.data)) }
    assertValidTensor(tensor)
    return tensor
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean)
  const shapeMatch = lines[0].match(/^#?\s*shape\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!shapeMatch) throw new Error('CSV must start with “shape: B,H,W,C”.')
  const shape = shapeMatch.slice(1).map(Number) as TensorShape
  const errors = validateShape(shape)
  if (errors.length) throw new Error(errors.join(' '))
  const values = lines.slice(1).join(',').split(/[\s,]+/).filter(Boolean).map(Number)
  if (values.some((value) => !Number.isFinite(value))) throw new Error('CSV contains a non-numeric value.')
  if (values.length !== elementCount(shape)) throw new Error(`Expected ${elementCount(shape)} values, received ${values.length}.`)
  return { shape, data: Float32Array.from(values) }
}

export function tensorToJson(tensor: Tensor4D): string {
  return JSON.stringify({ format: 'tensor-4d-viz/1', shape: tensor.shape, order: 'row-major', data: Array.from(tensor.data) }, null, 2)
}

export function downloadTensorJson(tensor: Tensor4D) {
  const blob = new Blob([tensorToJson(tensor)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `tensor-${tensor.shape.join('x')}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
