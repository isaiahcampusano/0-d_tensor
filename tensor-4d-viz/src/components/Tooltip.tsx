import type { PointerPosition } from '../hooks/useHighlight'
import { coordsOf, type Tensor4D } from '../lib/tensorMath'

interface Props { tensor: Tensor4D; index: number | null; pointer: PointerPosition | null }

export function Tooltip({ tensor, index, pointer }: Props) {
  if (index === null || !pointer) return null
  const coords = coordsOf(tensor.shape, index)
  return (
    <div className="tensor-tooltip" style={{ left: pointer.x + 14, top: pointer.y + 14 }} role="status">
      <span>flat[{index}]</span><b>({coords.join(', ')})</b><strong>{Number(tensor.data[index].toFixed(5))}</strong>
    </div>
  )
}
