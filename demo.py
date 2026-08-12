from tensor import Tensor

# 1. 0-D scalar
t0 = Tensor(5)
print(f"0-D: shape={t0.shape}, data={t0._data}")
print(t0.visualize())   # 5

# 2. Expand to 1-D
t1 = t0.expand_dims(0)
print(f"1-D: shape={t1.shape}, data={t1._data}")
print(t1.visualize())   # [5]

# 3. Expand to 2-D
t2 = t1.expand_dims(0)   # (1, 1)
print(f"2-D: shape={t2.shape}, data={t2._data}")
print(t2.visualize())   # [[5]]

# 4. Expand to 3-D
t3 = t2.expand_dims(1)   # (1, 1, 1)
print(f"3-D: shape={t3.shape}, data={t3._data}")
print(t3.visualize())   # [[[5]]]

# 5. Expand to 4-D
t4 = t3.expand_dims(0)   # (1, 1, 1, 1)
print(f"4-D: shape={t4.shape}, data={t4._data}")
print(t4.visualize())   # [[[[5]]]]

# 6. Demonstrate a real 2-D matrix from a nested list
t_mat = Tensor([[1, 2, 3], [4, 5, 6]])
print(t_mat.visualize())  # [[1, 2, 3], [4, 5, 6]]
print(f"ndim={t_mat.ndim}, shape={t_mat.shape}")
