"""DojoPool package setup."""

from setuptools import setup, find_packages

setup(
    name="dojopool",
    version="1.0.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "Flask>=2.3.3",
        "Flask-SQLAlchemy>=3.0.5",
        "Flask-Login>=0.6.2",
        "Flask-Mail>=0.9.1",
        "Flask-Migrate>=4.0.4",
        "Flask-WTF>=1.1.1",
        "Flask-Limiter>=3.3.1",
        "Flask-Talisman>=1.0.0",
        "Flask-SocketIO>=5.3.4",
        "gunicorn>=21.2.0",
        "gevent>=23.7.0",
        "gevent-websocket>=0.10.1",
    ],
    python_requires=">=3.11",
) 