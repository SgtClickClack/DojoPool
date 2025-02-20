from functools import wraps
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, abort, current_app
from flask.typing import ResponseReturnValue
from flask_login import current_user
from werkzeug.wrappers import Response as WerkzeugResponse


def admin_required(f) -> Union[Any, decorated_function]:
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)

    return decorated_function
