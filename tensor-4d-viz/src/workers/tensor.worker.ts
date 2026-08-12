import { resizeTensor, type Tensor4D, type TensorShape } from '../lib/tensorMath'
import { parseTensorInput } from '../lib/importExport'

interface ResizeRequest {
  id: number
  type: 'resize'
  tensor: Tensor4D
  shape: TensorShape
}

interface ParseRequest {
  id: number
  type: 'parse'
  text: string
}

self.onmessage = ({ data: request }: MessageEvent<ResizeRequest | ParseRequest>) => {
  try {
    const tensor = request.type === 'resize'
      ? resizeTensor(request.tensor, request.shape)
      : parseTensorInput(request.text)
    self.postMessage({ id: request.id, tensor }, { transfer: [tensor.data.buffer] })
  } catch (error) {
    self.postMessage({ id: request.id, error: error instanceof Error ? error.message : 'Worker operation failed.' })
  }
}
