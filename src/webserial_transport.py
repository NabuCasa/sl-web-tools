from __future__ import annotations

import asyncio
import collections.abc
import logging
import contextlib
import sys
from typing import final, Any, Callable

import js

# Patch some built-in modules so that pyserial imports
try:
    import fcntl  # noqa: F401
except ImportError:
    sys.modules["fcntl"] = object()  # type: ignore[assignment]

try:
    import termios  # noqa: F401
except ImportError:
    sys.modules["termios"] = object()  # type: ignore[assignment]


class MockSqlite3:
    sqlite_version = "3.31.1"
    sqlite_version_info = (3, 31, 1)


try:
    import sqlite3  # noqa: F401
except ImportError:
    sys.modules["sqlite3"] = MockSqlite3()


_WRITE_FLUSH_TIMEOUT = 5.0  # seconds

_SERIAL_PORT = None
_SERIAL_PORT_CLOSING_TASKS: list[asyncio.Task[Any]] = []

_LOGGER = logging.getLogger(__name__)


@final
class ExitSentinel:
    """A sentinel object to signal writer loop exit."""


class WebSerialTransport(asyncio.Transport):
    def __init__(
        self,
        loop: asyncio.BaseEventLoop,
        protocol: asyncio.Protocol,
        port,
    ) -> None:
        super().__init__()
        self._loop: asyncio.BaseEventLoop = loop
        self._protocol: asyncio.Protocol | None = protocol
        self._port = port

        self._write_queue: asyncio.Queue[bytes | type[ExitSentinel]] = asyncio.Queue()
        self._is_closing = False
        self._close_port_task: asyncio.Task[None] | None = None

        self._js_reader = self._port.readable.getReader()
        self._js_writer = self._port.writable.getWriter()

        self._reader_task = loop.create_task(self._reader_loop())
        self._writer_task = loop.create_task(self._writer_loop())

        self._loop.call_soon(self._protocol.connection_made, self)

    async def _writer_loop(self) -> None:
        while True:
            chunk = await self._write_queue.get()

            if chunk is ExitSentinel:
                _LOGGER.debug("Received exit sentinel, exiting")
                return

            try:
                await self._js_writer.write(js.Uint8Array.new(chunk))
            except Exception as e:
                _LOGGER.error("Error writing to serial port", exc_info=e)
                self._cleanup(e)
                break

    async def _reader_loop(self) -> None:
        while True:
            result = await self._js_reader.read()
            if result.done:
                self._cleanup(RuntimeError("Other side has closed"))
                return

            assert self._protocol is not None
            self._protocol.data_received(bytes(result.value))

    async def set_signals(
        self, rts: bool | None = None, dtr: bool | None = None, **kwargs: bool | None
    ) -> None:
        other_signals = {k: v for k, v in kwargs.items() if v is not None}
        if other_signals:
            _LOGGER.warning(
                "Ignoring unsupported flow control signals: %s", other_signals
            )

        signals = {}

        if rts is not None:
            signals["requestToSend"] = rts

        if dtr is not None:
            signals["dataTerminalReady"] = dtr

        if signals:
            await self._port.setSignals(**signals)

    def write(self, data: bytes) -> None:
        self._write_queue.put_nowait(data)

    def set_protocol(self, protocol: asyncio.Protocol) -> None:  # type: ignore[override]
        self._protocol = protocol

    def get_protocol(self) -> asyncio.BaseProtocol:
        assert self._protocol is not None
        return self._protocol

    def is_closing(self) -> bool:
        return self._is_closing

    def __del__(self):
        self._cleanup(RuntimeError("Transport was not closed!"))

    async def _close_port(self, exception: Exception | None) -> None:
        _LOGGER.debug("Flushing pending writes")

        # First, wait for writes to finish
        try:
            async with asyncio.timeout(_WRITE_FLUSH_TIMEOUT):
                _LOGGER.debug("Waiting for pending writes to finish")
                self._write_queue.put_nowait(ExitSentinel)
                await self._writer_task
        except asyncio.TimeoutError:
            _LOGGER.debug("Write task did not exit in time, cancelling it")
            with contextlib.suppress(asyncio.CancelledError):
                self._writer_task.cancel()
                await self._writer_task

        if self._js_writer is not None:
            self._js_writer.releaseLock()
            self._js_writer = None

        if self._port is not None:
            _LOGGER.debug("Closing serial port")
            await self._port.close()
            self._port = None

        assert self._close_port_task is not None

        # If the task cannot be removed, we should still call `connection_lost`
        try:
            _SERIAL_PORT_CLOSING_TASKS.remove(self._close_port_task)
        except ValueError:
            pass

        # Only now do we call `connection_lost`
        _LOGGER.debug("Calling protocol connection_lost(%r)", exception)
        if self._protocol is not None:
            self._protocol.connection_lost(exception)
            self._protocol = None

    def _cleanup(self, exception: Exception | None) -> None:
        self._is_closing = True

        # The reader task should be cancelled. We do not cancel the writer task, we wait
        # for it to cleanly exit.
        self._reader_task.cancel()

        if self._js_reader is not None:
            self._js_reader.releaseLock()
            self._js_reader = None

        if self._port is not None and self._close_port_task is None:
            self._close_port_task = asyncio.create_task(self._close_port(exception))
            _SERIAL_PORT_CLOSING_TASKS.append(self._close_port_task)
        elif self._protocol is not None:
            # If we have no serial port but have a connected protocol, we still need to
            # notify the protocol that the connection is lost
            self._protocol.connection_lost(exception)

    def close(self) -> None:
        self._cleanup(None)


def set_global_serial_port(serial_port) -> None:
    global _SERIAL_PORT
    _SERIAL_PORT = serial_port


async def create_serial_connection(
    loop: asyncio.BaseEventLoop,
    protocol_factory: Callable[[], asyncio.Protocol],
    url: str,
    *,
    parity=None,
    stopbits=None,
    baudrate: int,
    rtscts=False,
    xonxoff=False,
) -> tuple[WebSerialTransport, asyncio.Protocol]:
    _LOGGER.debug("Opening a serial connection at %d with rtscts=%s", baudrate, rtscts)

    while _SERIAL_PORT_CLOSING_TASKS:
        _LOGGER.warning(
            "Serial connection was not closed before a new one was opened!"
            " Waiting before opening a new one."
        )
        await _SERIAL_PORT_CLOSING_TASKS.pop()

    if _SERIAL_PORT is None:
        raise RuntimeError("Global serial port is not set")

    # `url` is ignored, `_SERIAL_PORT` is used instead
    await _SERIAL_PORT.open(
        baudRate=baudrate,
        flowControl="hardware" if rtscts else "none",
    )

    protocol = protocol_factory()
    transport = WebSerialTransport(loop, protocol, _SERIAL_PORT)

    return transport, protocol


# Directly patch zigpy-serial
import zigpy.serial

zigpy.serial.create_serial_connection = create_serial_connection
