# 0-d_tensor
ml data structure just a linked list - matrix table?

otw to 4d 

Perfect. With your answers locked in, I can now give you crystal-clear definitions **and** a hardened implementation spec that Copilot can execute without guessing.

---

## Part 1: 0‑D to 4‑D Tensors – Visualised with Shape & Data

A tensor’s **rank** (ndim) is the number of axes.  
A tensor’s **shape** is a tuple telling you the size of each axis.

| Rank | Name     | Shape      | Flat storage (your choice)        | Visual representation |
|:----:|----------|------------|-----------------------------------|------------------------|
| **0** | Scalar   | `()`       | `[42]` (length 1)                 | `42`                   |
| **1** | Vector   | `(3,)`     | `[1, 2, 3]`                       | `[1, 2, 3]`            |
| **2** | Matrix   | `(2, 3)`   | `[1,2,3, 4,5,6]`                  | `[[1,2,3], [4,5,6]]`   |
| **3** | 3‑Tensor | `(2, 2, 3)`| `[1,2,3, 4,5,6, 7,8,9, 10,11,12]`| `[[[1,2,3],[4,5,6]], [[7,8,9],[10,11,12]]]` |
| **4** | 4‑Tensor | `(2, 2, 2, 3)` | length = 2×2×2×3 = 24       | A list of 2 of the above 3‑tensors |

**Indexing rule:** for shape `(d0, d1, d2, d3)`, flat index = `((i0*d1 + i1)*d2 + i2)*d3 + i3`.

**Your 0‑D wrapper:** `Tensor(42)` → `self.data = [42]`, `self.shape = ()`.  
When you call `expand_dims(axis=0)` → becomes 1‑D with `shape=(1,)`, data stays `[42]`.

---

## Part 2: The Rigorous Copilot Handoff Document

Save this as **`TENSOR_SPEC.md`** in the root of your repo. This is written in a way that Copilot can directly translate to code, with algorithms, edge cases, and exact output expectations.

```markdown
# Tensor Implementation Specification (0‑D → 4‑D)

## 1. Project Constraints (Non‑negotiable)
- **Language**: Python 3.10+.
- **Dependencies**: **Zero**. No NumPy, no external libs.
- **Storage model**: Internal `self._data` is a **flat Python list**.  
  `self._shape` is a **tuple of ints**.  
  The product of `_shape` **must** equal `len(self._data)` at all times.

## 2. Class: `Tensor`

### 2.1 Constructor: `__init__(self, value, shape=None)`

**Behaviour**:
- If `shape` is `None`:
  - If `value` is an `int` or `float` → `shape = ()`, `_data = [value]`.
  - If `value` is a `list` → infer shape by recursively counting nested lengths.  
    *Example*: `[[1,2],[3,4]]` → shape `(2,2)`, `_data = [1,2,3,4]`.
- If `shape` is given:
  - Flatten `value` (if nested) and verify `len(flattened) == prod(shape)`.  
  - Raise `ValueError` if mismatch.

**Store**:
- `self._data = flat_list` (always a 1‑D list).
- `self.shape = tuple(shape)`
- `self.ndim = len(self.shape)`

---

### 2.2 Method: `expand_dims(self, axis)`

**Purpose**: Insert a new dimension of size 1 at position `axis`.  
*(E.g., 0‑D `()` → `(1,)` ; 1‑D `(3,)` with `axis=0` → `(1,3)`)*

**Algorithm**:
1. Normalise `axis`: if `axis < 0`, set `axis = self.ndim + axis + 1`.
2. Clamp `axis` to `[0, self.ndim]`. (You can insert at the end.)
3. New shape = `self.shape[:axis] + (1,) + self.shape[axis:]`.
4. Return a **new** `Tensor` instance with the **same `_data`** and the new shape.  
   *(Do not modify the original – tensors are immutable for shape operations.)*

**Edge cases**:
- Expanding a 0‑D scalar with `axis=0` → `shape=(1,)`, data `[5]`.
- Expanding a 2‑D `(2,3)` with `axis=1` → `(2,1,3)`.

---

### 2.3 Method: `visualize(self)`

**Purpose**: Print the tensor in a human‑readable, bracket‑nested format, **exactly** matching mathematical notation.

**Recursive algorithm** (implement as a private helper `_format(shape, data, offset)`):

```
def _format(shape, data, offset=0):
    if not shape:                          # 0‑D
        return str(data[offset])
    dim_size = shape[0]
    sub_shape = shape[1:]
    sub_len = prod(sub_shape) if sub_shape else 1
    pieces = []
    for i in range(dim_size):
        sub_offset = offset + i * sub_len
        pieces.append(self._format(sub_shape, data, sub_offset))
    return "[" + ", ".join(pieces) + "]"
```

**Printing**:
- `print(tensor.visualize())` should output exactly the bracket structure.  
- For `shape=(2,2)`, output `[[1, 2], [3, 4]]` (spaces after commas acceptable).

**Special 0‑D rule**: `visualize()` returns `str(self._data[0])` – no brackets.

---

### 2.4 Representation: `__repr__` and `__str__`

- `__repr__` → `f"Tensor(data={self._data}, shape={self.shape})"`
- `__str__` → same as `visualize()`.

---

### 2.5 Indexing (Bonus but recommended)

Implement `__getitem__(self, idx)`:
- If `idx` is a single int and `ndim == 1`, return the scalar.
- If `idx` is a tuple (e.g., `t[0,1]`), compute the flat index using row‑major order:
  ```
  flat_idx = 0
  for i, dim in enumerate(idx):
      flat_idx = flat_idx * self.shape[i] + dim
  return self._data[flat_idx]
  ```
- If the result is a sub‑array, return a new `Tensor` with the sliced shape.

*(For simplicity in the demo, you can skip advanced slicing and just support full integer indexing.)*

---

### 2.6 Validation Helper (private)

`_validate(self)` – raises `AssertionError` if `len(self._data) != prod(self.shape)`.  
Call this at the end of `__init__` and after any operation that changes shape.

---

## 3. Demo Script: `demo.py`

Create a script that **must** produce the following exact output when run.

```python
from tensor import Tensor

# 1. 0‑D scalar
t0 = Tensor(5)
print(f"0‑D: shape={t0.shape}, data={t0._data}")
print(t0.visualize())   # 5

# 2. Expand to 1‑D
t1 = t0.expand_dims(0)
print(f"1‑D: shape={t1.shape}, data={t1._data}")
print(t1.visualize())   # [5]

# 3. Expand to 2‑D
t2 = t1.expand_dims(0)   # (1,1)
print(f"2‑D: shape={t2.shape}, data={t2._data}")
print(t2.visualize())   # [[5]]

# 4. Expand to 3‑D
t3 = t2.expand_dims(1)   # (1,1,1)
print(f"3‑D: shape={t3.shape}, data={t3._data}")
print(t3.visualize())   # [[[5]]]

# 5. Expand to 4‑D
t4 = t3.expand_dims(0)   # (1,1,1,1)
print(f"4‑D: shape={t4.shape}, data={t4._data}")
print(t4.visualize())   # [[[[5]]]]

# 6. Demonstrate a real 2‑D matrix from nested list
t_mat = Tensor([[1, 2, 3], [4, 5, 6]])
print(t_mat.visualize())  # [[1, 2, 3], [4, 5, 6]]
print(f"ndim={t_mat.ndim}, shape={t_mat.shape}")
```

**Expected output** (exact string matching):
```
0‑D: shape=(), data=[5]
5
1‑D: shape=(1,), data=[5]
[5]
2‑D: shape=(1, 1), data=[5]
[[5]]
3‑D: shape=(1, 1, 1), data=[5]
[[[5]]]
4‑D: shape=(1, 1, 1, 1), data=[5]
[[[[5]]]]
[[1, 2, 3], [4, 5, 6]]
ndim=2, shape=(2, 3)
```

---

## 4. Repository Structure

```
/
├── tensor.py          # Main Tensor class
├── demo.py            # The script above
├── README.md          # (see section 5)
└── TENSOR_SPEC.md     # this file (for Copilot)
```

---

## 5. README.md Requirements (for Copilot to generate)

The `README.md` must contain:

- A **heading**: `# 0‑d_tensor – Educational ML Data Structure`
- A **definition table** exactly like the one in Part 1 of this spec (0‑D to 4‑D with shapes and examples).
- A **"Why flat list?"** paragraph:  
  *"We store data as a flat Python list with a separate shape tuple. This mirrors how NumPy stores arrays in contiguous memory, making it efficient and easy to reshape – unlike linked lists which are scattered and slow for dense numerical data."*
- A **"How to run"** section: `python demo.py`
- A **"What I learned"** section showing the relationship between `ndim`, `shape`, and nested bracket depth.

---

## 6. Copilot Coding Instructions (Pseudo‑prompt)

> "Implement the `Tensor` class defined in this spec. Use only built‑in Python.  
> - `__init__` must handle both raw scalars and nested lists.  
> - `expand_dims` returns a new Tensor, does not mutate.  
> - `visualize` uses recursion to print nested brackets.  
> - Include `prod()` helper to compute product of a tuple.  
> - Write docstrings for every public method.  
> - Do **not** import numpy or any external package.  
> - Output `demo.py` exactly as written."

---

## 7. Extension Hooks (Optional, for Copilot to keep in mind)

If you later want to add:
- **Arithmetic**: operator overloading (`__add__`, etc.) that broadcasts shapes.
- **Reshape**: flatten, then rechunk based on new shape.
- **Strides**: compute byte‑offset strides for faster indexing.

But for now, **strictly implement only** `__init__`, `expand_dims`, `visualize`, `__repr__`, `__str__`, and the helper `_format`.
```

---

## Next Steps for You

1. Create a new file `TENSOR_SPEC.md` in your repo and paste the above.
2. Open VS Code with Copilot enabled.
3. Create `tensor.py` and start typing the class skeleton – Copilot will read the spec (if you keep it open) and start suggesting the exact code.
4. If Copilot gets stuck, you can paste a snippet of the spec directly into the chat and ask: *"Implement the `visualize` method exactly as described in the spec."*

This handoff is **rigorous enough** that Copilot can produce a working implementation on the first or second try, with minimal manual correction. Good luck – and feel free to share the generated code if you want a final review!
