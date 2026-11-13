
"""
AUMVEDA Customer Backend
Public read-only response cache.

Reduces repeated Supabase database requests.

IMPORTANT:
- Only cache public, non-personalized data.
- Never cache cart, wishlist, customer details,
  checkout, orders or payment operations.
- Cache is local to the current Python process.
"""

import copy
import functools
import threading
import time
from collections import OrderedDict


_CACHE = OrderedDict()
_INFLIGHT = {}
_LOCK = threading.RLock()

MAX_CACHE_ENTRIES = 256


def public_cache(ttl_seconds=300):
    """Cache successful read-only function results."""

    def decorator(function):

        @functools.wraps(function)
        def wrapper(*args, **kwargs):
            key = (
                function.__module__,
                function.__qualname__,
                repr(args),
                repr(sorted(kwargs.items())),
            )

            while True:
                with _LOCK:
                    now = time.monotonic()
                    entry = _CACHE.get(key)

                    if entry is not None:
                        expires_at, value = entry

                        if now < expires_at:
                            _CACHE.move_to_end(key)
                            return copy.deepcopy(value)

                        _CACHE.pop(key, None)

                    event = _INFLIGHT.get(key)

                    if event is None:
                        event = threading.Event()
                        _INFLIGHT[key] = event
                        break

                event.wait()

            try:
                result = function(*args, **kwargs)

                with _LOCK:
                    _CACHE[key] = (
                        time.monotonic() + ttl_seconds,
                        copy.deepcopy(result),
                    )

                    _CACHE.move_to_end(key)

                    while len(_CACHE) > MAX_CACHE_ENTRIES:
                        _CACHE.popitem(last=False)

                return result

            finally:
                with _LOCK:
                    event = _INFLIGHT.pop(key, None)

                    if event is not None:
                        event.set()

        return wrapper

    return decorator


def clear_public_cache():
    """Clear public cached responses in this worker."""
    with _LOCK:
        _CACHE.clear()


def public_cache_stats():
    """Return basic cache diagnostic information."""
    with _LOCK:
        return {
            "entries": len(_CACHE),
            "inflight_requests": len(_INFLIGHT),
            "max_entries": MAX_CACHE_ENTRIES,
        }
