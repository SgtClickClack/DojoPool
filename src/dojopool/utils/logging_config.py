import logging

import json_log_formatter

formatter = json_log_formatter.JSONFormatter()

handler = logging.StreamHandler()
handler.setFormatter(formatter)

logger = logging.getLogger("dojopool")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Example usage:
if __name__ == "__main__":
    logger.info("DojoPool logging configured successfully.", extra={"event": "startup"})
