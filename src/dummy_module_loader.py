import sys
from unittest.mock import MagicMock
from importlib.machinery import ModuleSpec


class DummyFinderLoader:
    """Combined module loader and finder that recursively returns Mock objects."""

    def __init__(self, name):
        self.name = name

    def create_module(self, spec):
        return MagicMock(__path__=[])

    def exec_module(self, module):
        pass

    def find_spec(self, fullname, path, target=None):
        if fullname.startswith(self.name):
            return ModuleSpec(fullname, self)

        return None


def __getattr__(name):
    """Mock out all attribute access for this module."""
    return MagicMock()


sys.meta_path.append(DummyFinderLoader(__name__))
