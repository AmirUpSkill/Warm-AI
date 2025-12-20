import logging
import sys
from typing import Literal

def configure_logging(
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO",
    logger_name: str = "warm_ai"
) -> logging.Logger:
    """
    Configures a logger for the application with a console handler.

    Args:
        log_level (Literal): The minimum level of messages to log.
        logger_name (str): The name of the logger.

    Returns:
        logging.Logger: The configured logger instance.
    """
    logger = logging.getLogger(logger_name)
    logger.setLevel(log_level)

    # ---  Prevent duplicate handlers if called multiple times ---
    if not logger.handlers:
        # --- Create console handler with a formatter ---
        console_handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s"
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger

app_logger = configure_logging(log_level="INFO")
