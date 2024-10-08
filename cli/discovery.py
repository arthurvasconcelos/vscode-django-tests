# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import argparse
import json
import os
import pathlib
import sys
import traceback
import unittest
from typing import List, Literal, Optional, Tuple, TypedDict, Union

PYTHON_FILES = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PYTHON_FILES)
sys.path.insert(0, os.getcwd())

from django.test.runner import DiscoverRunner

from unittest_utils import TestNode, build_test_tree, parse_unittest_args


if __name__ == "__main__":
    import django
    django.setup()
    
    args = parse_unittest_args(sys.argv)
    root = args.root if 'root' in args else './'

    suite = DiscoverRunner(verbosity=-1, top_level=root).build_suite()
    tests, errors = build_test_tree(suite, os.getcwd())

    sys.stdout.write(json.dumps(tests))
