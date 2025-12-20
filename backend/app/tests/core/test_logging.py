import logging
from app.core.logging import configure_logging

def test_configure_logging_instance():
    """Test if the logger is correctly initialized."""
    logger_name = "test_logger"
    logger = configure_logging(log_level="DEBUG", logger_name=logger_name)

    assert logger.name == logger_name
    assert logger.level == logging.DEBUG
    assert len(logger.handlers) > 0
    assert isinstance(logger.handlers[0], logging.StreamHandler)

def test_logging_singleton_behavior():
    """Test that multiple calls to configure_logging don't duplicate handlers."""
    logger = configure_logging(logger_name="duplicate_test")
    initial_handler_count = len(logger.handlers)
    
    # Call again
    logger = configure_logging(logger_name="duplicate_test")
    assert len(logger.handlers) == initial_handler_count