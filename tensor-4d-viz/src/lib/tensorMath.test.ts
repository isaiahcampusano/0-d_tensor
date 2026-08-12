import { describe, expect, it } from 'vitest'
import { coordsOf, elementCount, indexOf, resizeTensor, validateShape, type Tensor4D } from './tensorMath'

describe('tensorMath', () => {
  it('maps coordinates to row-major indices and back', () => {
    const shape: [number, number, number, number] = [4, 3, 3, 3]
    expect(indexOf(shape, 0, 1, 2, 0)).toBe(15)
    expect(coordsOf(shape, 15)).toEqual([0, 1, 2, 0])
    expect(coordsOf(shape, 107)).toEqual([3, 2, 2, 2])
  })

  it('supports the smallest shape', () => {
    const shape: [number, number, number, number] = [1, 1, 1, 1]
    expect(elementCount(shape)).toBe(1)
    expect(indexOf(shape, 0, 0, 0, 0)).toBe(0)
    expect(coordsOf(shape, 0)).toEqual([0, 0, 0, 0])
  })

  it('preserves overlapping coordinates while resizing', () => {
    const tensor: Tensor4D = { shape: [1, 2, 2, 1], data: Float32Array.from([1, 2, 3, 4]) }
    const resized = resizeTensor(tensor, [2, 3, 1, 2])
    expect(resized.data[indexOf(resized.shape, 0, 0, 0, 0)]).toBe(1)
    expect(resized.data[indexOf(resized.shape, 0, 1, 0, 0)]).toBe(3)
    expect(resized.data[indexOf(resized.shape, 1, 0, 0, 0)]).toBe(0)
  })

  it('enforces dimension and total limits', () => {
    expect(validateShape([8, 16, 16, 4])).toEqual([])
    expect(validateShape([9, 1, 1, 1])).not.toEqual([])
    expect(validateShape([1, 0, 1, 1])).not.toEqual([])
  })

  it('rejects invalid flat indices', () => {
    expect(() => coordsOf([1, 1, 1, 1], 1)).toThrow(RangeError)
  })
})
