import sys
import unittest.mock
from importlib.machinery import ModuleSpec


class DummyLoader:
    """
    Loader that creates Mock objects for modules.
    """

    def create_module(self, spec):
        return None

    def exec_module(self, module):
        for attr in dir(unittest.mock.MagicMock):
            if not attr.startswith('_'):
                setattr(module, attr, getattr(unittest.mock.MagicMock, attr))
        module.__path__ = []


class DummyFinder:
    """
    Combined module loader and finder that recursively returns Mock objects.
    """

    def __init__(self, name):
        self.name = name
        self.loader = DummyLoader()

    def find_spec(self, fullname, path, target=None):
        if fullname.startswith(self.name):
            return ModuleSpec(fullname, self.loader)
        return None


def __getattr__(name):
    return unittest.mock.MagicMock()


sys.meta_path.append(DummyFinder(__name__))
