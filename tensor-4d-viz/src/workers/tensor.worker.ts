import { resizeTensor, type Tensor4D, type TensorShape } from '../lib/tensorMath'

interface ResizeRequest {
  id: number
  type: 'resize'
  tensor: Tensor4D
  shape: TensorShape
}

self.onmessage = ({ data: request }: MessageEvent<ResizeRequest>) => {
  try {
    const tensor = resizeTensor(request.tensor, request.shape)
    self.postMessage({ id: request.id, tensor }, { transfer: [tensor.data.buffer] })
  } catch (error) {
    self.postMessage({ id: request.id, error: error instanceof Error ? error.message : 'Worker operation failed.' })
  }
}
