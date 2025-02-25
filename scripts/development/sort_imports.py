import collections

try:
    _ = collections.MutableSet
except AttributeError:
    from collections.abc import MutableSet

    setattr(collections, "MutableSet", MutableSet)  # type: ignore
import isort.main
