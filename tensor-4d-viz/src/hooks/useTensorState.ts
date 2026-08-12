import { useCallback, useRef, useState } from 'react'
import {
  createSampleTensor,
  elementCount,
  resizeTensor,
  updateValue,
  validateShape,
  type Tensor4D,
  type TensorShape,
} from '../lib/tensorMath'
import { useTensorWorker } from './useTensorWorker'

export function useTensorState() {
  const [tensor, setTensor] = useState<Tensor4D>(createSampleTensor)
  const [busy, setBusy] = useState(false)
  const operation = useRef(0)
  const worker = useTensorWorker()

  const setShape = useCallback(async (shape: TensorShape) => {
    if (validateShape(shape).length) return
    const request = ++operation.current
    if (elementCount(shape) < 2_048) {
      setBusy(false)
      setTensor((current) => resizeTensor(current, shape))
      return
    }
    setBusy(true)
    try {
      const next = await worker.resize(tensor, shape)
      if (request === operation.current) setTensor(next)
    } finally {
      if (request === operation.current) setBusy(false)
    }
  }, [tensor, worker])

  const setValue = useCallback((index: number, value: number) => {
    setTensor((current) => updateValue(current, index, value))
  }, [])

  const replaceTensor = useCallback((next: Tensor4D) => {
    operation.current += 1
    setTensor(next)
  }, [])

  return { tensor, busy, setShape, setValue, replaceTensor }
}
