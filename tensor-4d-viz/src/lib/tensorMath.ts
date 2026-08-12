export type TensorShape = [number, number, number, number]

export interface Tensor4D {
  shape: TensorShape
  data: Float32Array
}

export const TENSOR_LIMITS = {
  B: 8,
  H: 16,
  W: 16,
  C: 4,
  total: 16_384,
} as const

export function elementCount(shape: TensorShape): number {
  return shape.reduce((product, dimension) => product * dimension, 1)
}

export function validateShape(shape: TensorShape): string[] {
  const errors: string[] = []
  const names = ['B', 'H', 'W', 'C'] as const
  const limits = [TENSOR_LIMITS.B, TENSOR_LIMITS.H, TENSOR_LIMITS.W, TENSOR_LIMITS.C]

  shape.forEach((value, index) => {
    if (!Number.isInteger(value) || value < 1) errors.push(`${names[index]} must be a positive integer.`)
    if (value > limits[index]) errors.push(`${names[index]} must be at most ${limits[index]}.`)
  })

  if (elementCount(shape) > TENSOR_LIMITS.total) {
    errors.push(`Tensor must contain at most ${TENSOR_LIMITS.total.toLocaleString()} elements.`)
  }
  return errors
}

export function assertValidTensor(tensor: Tensor4D): void {
  const errors = validateShape(tensor.shape)
  if (tensor.data.length !== elementCount(tensor.shape)) {
    errors.push(`Data length ${tensor.data.length} does not match shape size ${elementCount(tensor.shape)}.`)
  }
  if (errors.length) throw new Error(errors.join(' '))
}

export function indexOf(
  shape: TensorShape,
  b: number,
  h: number,
  w: number,
  c: number,
): number {
  const [, H, W, C] = shape
  return b * (H * W * C) + h * (W * C) + w * C + c
}

export function coordsOf(shape: TensorShape, flatIndex: number): TensorShape {
  if (!Number.isInteger(flatIndex) || flatIndex < 0 || flatIndex >= elementCount(shape)) {
    throw new RangeError(`Flat index ${flatIndex} is outside this tensor.`)
  }
  const [, H, W, C] = shape
  const batchSize = H * W * C
  const b = Math.floor(flatIndex / batchSize)
  const batchRemainder = flatIndex % batchSize
  const h = Math.floor(batchRemainder / (W * C))
  const rowRemainder = batchRemainder % (W * C)
  const w = Math.floor(rowRemainder / C)
  return [b, h, w, rowRemainder % C]
}

export function resizeTensor(tensor: Tensor4D, nextShape: TensorShape): Tensor4D {
  const errors = validateShape(nextShape)
  if (errors.length) throw new Error(errors.join(' '))
  const nextData = new Float32Array(elementCount(nextShape))
  const [B, H, W, C] = tensor.shape.map((value, index) => Math.min(value, nextShape[index])) as TensorShape

  for (let b = 0; b < B; b += 1) {
    for (let h = 0; h < H; h += 1) {
      for (let w = 0; w < W; w += 1) {
        for (let c = 0; c < C; c += 1) {
          nextData[indexOf(nextShape, b, h, w, c)] = tensor.data[indexOf(tensor.shape, b, h, w, c)]
        }
      }
    }
  }
  return { shape: nextShape, data: nextData }
}

export function updateValue(tensor: Tensor4D, flatIndex: number, value: number): Tensor4D {
  if (flatIndex < 0 || flatIndex >= tensor.data.length) throw new RangeError('Index outside tensor.')
  const data = tensor.data.slice()
  data[flatIndex] = value
  return { shape: tensor.shape, data }
}

export function createSampleTensor(): Tensor4D {
  const shape: TensorShape = [1, 3, 3, 3]
  const data = Float32Array.from({ length: elementCount(shape) }, (_, index) => {
    const [, h, w, c] = coordsOf(shape, index)
    return Number((((h + 1) * (w + 2) + c * 1.7) / 10).toFixed(2))
  })
  return { shape, data }
}
