import { useCallback, useEffect, useRef } from 'react'
import type { Tensor4D, TensorShape } from '../lib/tensorMath'

interface WorkerResponse {
  id: number
  tensor?: Tensor4D
  error?: string
}

export function useTensorWorker() {
  const workerRef = useRef<Worker | null>(null)
  const nextId = useRef(0)
  const pending = useRef(new Map<number, { resolve: (tensor: Tensor4D) => void; reject: (error: Error) => void }>())

  useEffect(() => {
    const pendingCallbacks = pending.current
    const worker = new Worker(new URL('../workers/tensor.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const callback = pendingCallbacks.get(data.id)
      if (!callback) return
      pendingCallbacks.delete(data.id)
      if (data.error || !data.tensor) callback.reject(new Error(data.error ?? 'Worker returned no tensor.'))
      else callback.resolve({ shape: data.tensor.shape, data: new Float32Array(data.tensor.data) })
    }
    workerRef.current = worker
    return () => {
      worker.terminate()
      pendingCallbacks.forEach(({ reject }) => reject(new Error('Tensor worker stopped.')))
      pendingCallbacks.clear()
    }
  }, [])

  const resize = useCallback((tensor: Tensor4D, shape: TensorShape) => {
    const worker = workerRef.current
    if (!worker) return Promise.reject(new Error('Tensor worker is not ready.'))
    const id = nextId.current++
    return new Promise<Tensor4D>((resolve, reject) => {
      pending.current.set(id, { resolve, reject })
      const copy = tensor.data.slice()
      worker.postMessage({ id, type: 'resize', tensor: { shape: tensor.shape, data: copy }, shape }, [copy.buffer])
    })
  }, [])

  const parse = useCallback((text: string) => {
    const worker = workerRef.current
    if (!worker) return Promise.reject(new Error('Tensor worker is not ready.'))
    const id = nextId.current++
    return new Promise<Tensor4D>((resolve, reject) => {
      pending.current.set(id, { resolve, reject })
      worker.postMessage({ id, type: 'parse', text })
    })
  }, [])

  return { resize, parse }
}
