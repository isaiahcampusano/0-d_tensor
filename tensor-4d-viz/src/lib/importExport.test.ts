import { describe, expect, it } from 'vitest'
import { parseTensorInput, tensorToJson } from './importExport'

describe('tensor import and export', () => {
  it('round-trips documented JSON without changing float data', () => {
    const original = { shape: [1, 1, 2, 2] as [number, number, number, number], data: Float32Array.from([0.1, 0.2, 0.3, 0.4]) }
    const parsed = parseTensorInput(tensorToJson(original))
    expect(parsed.shape).toEqual(original.shape)
    expect(Array.from(parsed.data)).toEqual(Array.from(original.data))
  })

  it('infers a rectangular four-dimensional nested list', () => {
    const parsed = parseTensorInput('[[[[1, 2], [3, 4]]]]')
    expect(parsed.shape).toEqual([1, 1, 2, 2])
    expect(Array.from(parsed.data)).toEqual([1, 2, 3, 4])
  })

  it('parses CSV with shape metadata', () => {
    const parsed = parseTensorInput('shape: 1,1,2,2\n1,2,3,4')
    expect(parsed.shape).toEqual([1, 1, 2, 2])
    expect(Array.from(parsed.data)).toEqual([1, 2, 3, 4])
  })

  it('rejects ragged arrays and mismatched data lengths', () => {
    expect(() => parseTensorInput('[[[[1], [2, 3]]]]')).toThrow('rectangular')
    expect(() => parseTensorInput('{"shape":[1,1,1,2],"data":[1]}')).toThrow('does not match')
  })

  it('enforces tensor limits during import', () => {
    expect(() => parseTensorInput('{"shape":[9,1,1,1],"data":[1,2,3,4,5,6,7,8,9]}')).toThrow('B must be at most 8')
  })
})
