from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import current_app, render_template
from flask.typing import ResponseReturnValue
from flask_mail import Message
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.extensions import mail

def send_email(subject: ...): ...
def send_reset_email(user_email: ...): ...
