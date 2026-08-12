"""A small, dependency-free tensor data structure for learning purposes."""

from __future__ import annotations

from collections.abc import Sequence
from typing import TypeAlias


Number: TypeAlias = int | float
NestedValues: TypeAlias = Number | list["NestedValues"]


def prod(dimensions: Sequence[int]) -> int:
    """Return the product of a sequence of dimensions."""
    result = 1
    for dimension in dimensions:
        result *= dimension
    return result


def _flatten_and_infer(value: NestedValues) -> tuple[list[Number], tuple[int, ...]]:
    """Flatten a scalar or rectangular nested list and infer its shape."""
    if isinstance(value, bool) or not isinstance(value, (int, float, list)):
        raise TypeError("tensor values must be numbers or nested lists of numbers")

    if not isinstance(value, list):
        return [value], ()

    if not value:
        return [], (0,)

    flat_data: list[Number] = []
    child_shape: tuple[int, ...] | None = None

    for item in value:
        item_data, item_shape = _flatten_and_infer(item)
        if child_shape is None:
            child_shape = item_shape
        elif item_shape != child_shape:
            raise ValueError("nested lists must have a rectangular shape")
        flat_data.extend(item_data)

    # The list is non-empty, so its first child always established a shape.
    assert child_shape is not None
    return flat_data, (len(value),) + child_shape


def _validate_shape(shape: Sequence[int]) -> tuple[int, ...]:
    """Return a normalized shape after validating its dimensions."""
    normalized = tuple(shape)
    if any(isinstance(dimension, bool) or not isinstance(dimension, int)
           for dimension in normalized):
        raise TypeError("shape dimensions must be integers")
    if any(dimension < 0 for dimension in normalized):
        raise ValueError("shape dimensions cannot be negative")
    return normalized


class Tensor:
    """Store tensor values in a flat list with a separate immutable shape."""

    def __init__(self, value: NestedValues, shape: Sequence[int] | None = None) -> None:
        """Create a tensor from a number or a rectangular nested list.

        When ``shape`` is omitted, it is inferred from ``value``. When supplied,
        its element count must match the number of flattened values.
        """
        flat_data, inferred_shape = _flatten_and_infer(value)
        normalized_shape = inferred_shape if shape is None else _validate_shape(shape)

        if len(flat_data) != prod(normalized_shape):
            raise ValueError(
                f"data has {len(flat_data)} values, but shape {normalized_shape} "
                f"requires {prod(normalized_shape)}"
            )

        self._data = flat_data
        self._shape = normalized_shape
        self._validate()

    @property
    def shape(self) -> tuple[int, ...]:
        """Return the size of each tensor axis."""
        return self._shape

    @property
    def ndim(self) -> int:
        """Return the number of tensor axes."""
        return len(self._shape)

    def expand_dims(self, axis: int) -> Tensor:
        """Return a new tensor with a size-one dimension inserted at ``axis``."""
        if isinstance(axis, bool) or not isinstance(axis, int):
            raise TypeError("axis must be an integer")

        if axis < 0:
            axis = self.ndim + axis + 1
        axis = max(0, min(axis, self.ndim))

        new_shape = self.shape[:axis] + (1,) + self.shape[axis:]
        return Tensor(self._data, shape=new_shape)

    def visualize(self) -> str:
        """Return the tensor in human-readable, bracket-nested notation."""
        return self._format(self.shape, 0)

    def _format(self, shape: tuple[int, ...], offset: int) -> str:
        """Recursively format values beginning at ``offset`` for ``shape``."""
        if not shape:
            return str(self._data[offset])

        sub_shape = shape[1:]
        sub_length = prod(sub_shape)
        pieces = [
            self._format(sub_shape, offset + index * sub_length)
            for index in range(shape[0])
        ]
        return "[" + ", ".join(pieces) + "]"

    def _validate(self) -> None:
        """Assert that the flat data length agrees with the tensor shape."""
        assert len(self._data) == prod(self.shape), (
            "tensor data length must equal the product of its shape"
        )

    def __repr__(self) -> str:
        """Return an unambiguous representation of the tensor."""
        return f"Tensor(data={self._data}, shape={self.shape})"

    def __str__(self) -> str:
        """Return the tensor's bracket-nested visualization."""
        return self.visualize()
