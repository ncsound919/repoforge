# Ensure the repo root is on sys.path so `worker` is importable as a package.
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
