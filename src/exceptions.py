class ValidationError(Exception):
    """Exception raised for validation errors in the application.

    Attributes:
        message -- explanation of the error
    """

    def __init__(self, message):
        self.message = message
        super().__init__(self.message) 