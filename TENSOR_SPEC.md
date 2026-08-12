# Tensor Implementation Specification (0-D → 4-D)

## 1. Project constraints

- **Language:** Python 3.10 or newer.
- **Dependencies:** none. Do not use NumPy or other external libraries.
- **Storage model:** `Tensor._data` is a flat Python list and `Tensor._shape`
  is a tuple of non-negative integers.
- **Invariant:** the product of `_shape` always equals `len(_data)`.

## 2. `Tensor` class

### Construction

`Tensor(value, shape=None)` accepts a number or a rectangular nested list of
numbers. Without an explicit shape, the constructor recursively infers the shape
and flattens the values in row-major order.

```python
Tensor(42)                    # data=[42], shape=()
Tensor([1, 2, 3])             # data=[1, 2, 3], shape=(3,)
Tensor([[1, 2], [3, 4]])      # data=[1, 2, 3, 4], shape=(2, 2)
Tensor([1, 2, 3, 4], (2, 2)) # data=[1, 2, 3, 4], shape=(2, 2)
```

An explicit shape must contain only non-negative integers and its product must
match the number of values. Ragged nested lists are invalid.

### `expand_dims(axis)`

Return a new tensor with a dimension of size one inserted at `axis`; do not
modify the original tensor. Negative axes are normalized using
`ndim + axis + 1`, then all axes are clamped to the inclusive range
`[0, ndim]`.

```python
Tensor(5).expand_dims(0).shape              # (1,)
Tensor([1, 2, 3]).expand_dims(0).shape      # (1, 3)
Tensor([[1, 2, 3]]).expand_dims(1).shape    # (1, 1, 3)
```

### `visualize()`

Return mathematical, bracket-nested notation. A 0-D tensor is displayed as a
bare value without brackets.

```python
Tensor(5).visualize()                       # "5"
Tensor([1, 2, 3]).visualize()               # "[1, 2, 3]"
Tensor([[1, 2], [3, 4]]).visualize()        # "[[1, 2], [3, 4]]"
```

The formatter recursively partitions flat storage according to the current
shape. `str(tensor)` returns this visualization.

### Representation

`repr(tensor)` uses the exact form:

```text
Tensor(data=[...], shape=(...))
```

### Validation

The private `_validate()` helper asserts that the flat data length equals the
product of the shape. Construction and shape-changing operations must preserve
this invariant.

## 3. Demo

`demo.py` demonstrates a scalar expanding from 0-D through 4-D, followed by a
real 2-D matrix. Its exact output is:

```text
0-D: shape=(), data=[5]
5
1-D: shape=(1,), data=[5]
[5]
2-D: shape=(1, 1), data=[5]
[[5]]
3-D: shape=(1, 1, 1), data=[5]
[[[5]]]
4-D: shape=(1, 1, 1, 1), data=[5]
[[[[5]]]]
[[1, 2, 3], [4, 5, 6]]
ndim=2, shape=(2, 3)
```

## 4. Future extension hooks

Possible later additions include arithmetic with broadcasting, reshaping, and
explicit strides. They are outside this initial implementation.
