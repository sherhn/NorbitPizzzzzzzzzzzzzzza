"""
Настройка логирования.
"""

import logging
import sys
import json
from flask import has_request_context, request

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S.%fZ"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "service": "orders",
            "container": "pizza_orders",
        }

        if has_request_context():
            log_entry.update({
                "remote_addr": request.remote_addr,
                "method": request.method,
                "path": request.path,
                "user_agent": request.headers.get("User-Agent"),
            })

        if record.exc_info:
            log_entry["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)

def setup_logging(container_name="pizza_orders"):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    app_logger = logging.getLogger('flask.app')
    app_logger.handlers.clear()
    app_logger.addHandler(handler)
    app_logger.setLevel(logging.INFO)

    sa_logger = logging.getLogger('sqlalchemy.engine')
    sa_logger.setLevel(logging.WARNING)

    logging.getLogger("werkzeug").setLevel(logging.WARNING)

    print(f"JSON logging initialized for {container_name}", file=sys.stderr)