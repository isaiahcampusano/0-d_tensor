# 0-d_tensor – Educational ML Data Structure

An educational tensor implementation built with plain Python. It stores values in
a flat list and tracks their dimensions separately with a shape tuple.

**Interactive demo:** [Open the 0-D Tensor Playground](https://isaiahcampusano.github.io/0-d_tensor/)

## 0-D to 4-D tensors

A tensor's **rank** (`ndim`) is its number of axes. Its **shape** records the
size of each axis.

| Rank | Name | Shape | Flat storage | Visual representation |
|:---:|---|---|---|---|
| **0** | Scalar | `()` | `[42]` (length 1) | `42` |
| **1** | Vector | `(3,)` | `[1, 2, 3]` | `[1, 2, 3]` |
| **2** | Matrix | `(2, 3)` | `[1, 2, 3, 4, 5, 6]` | `[[1, 2, 3], [4, 5, 6]]` |
| **3** | 3-Tensor | `(2, 2, 3)` | `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]` | `[[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]` |
| **4** | 4-Tensor | `(2, 2, 2, 3)` | 24 values (`2 × 2 × 2 × 3`) | A list of two 3-tensors |

For a 4-D tensor with shape `(d0, d1, d2, d3)`, the row-major flat index is:

```text
((i0 * d1 + i1) * d2 + i2) * d3 + i3
```

## Why flat list?

We store data as a flat Python list with a separate shape tuple. This mirrors
how NumPy stores arrays in contiguous memory, making it efficient and easy to
reshape – unlike linked lists which are scattered and slow for dense numerical
data.

## How to run

Python 3.10 or newer is recommended. The project has no external dependencies.

```shell
python demo.py
```

## Interactive frontend

The `docs/` folder contains a dependency-free HTML, CSS, and JavaScript
playground for exploring rank, shape, nested notation, flat row-major storage,
and `expand_dims`. GitHub Pages cannot execute Python directly, so the browser
uses a small JavaScript port of the behavior defined by `tensor.py` and
`TENSOR_SPEC.md`; the Python version remains the source of truth.

No installation or build step is required. Serve the repository root and visit
`http://localhost:8000/docs/` (the local server lets the browser load the ES
modules correctly):

```shell
python -m http.server 8000
```

Run the frontend tests with Node's built-in test runner:

```shell
node --test docs/tests/*.test.mjs
```

The live site is published through GitHub Pages from the `main` branch's
`/docs` folder.

## Example

```python
from tensor import Tensor

matrix = Tensor([[1, 2, 3], [4, 5, 6]])

print(matrix.shape)       # (2, 3)
print(matrix.ndim)        # 2
print(matrix.visualize()) # [[1, 2, 3], [4, 5, 6]]
```

## What I learned

- `ndim` is the number of axes in a tensor.
- `shape` gives the length of every axis, so `len(shape) == ndim`.
- Each dimension adds one level of nested brackets to the visualization.
- A scalar is 0-D, has shape `()`, and is displayed without brackets.
- The same flat data can represent different shapes when the element count is
  unchanged.

See [`TENSOR_SPEC.md`](TENSOR_SPEC.md) for the complete implementation contract.
