"""DojoPool package setup."""

from setuptools import setup, find_packages

setup(
    name="dojopool",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask',
        'flask-sqlalchemy',
        'flask-migrate',
        'flask-login',
        'flask-mail',
        'flask-limiter',
        'flask-caching',
        'sqlalchemy',
        'psycopg2-binary',
        'python-dotenv',
        'pyjwt',
        'bcrypt',
        'requests',
        'pillow',
        'numpy',
        'python-dateutil',
        'pytz',
        'sendgrid',
        'redis',
    ],
    extras_require={
        'test': [
            'pytest',
            'pytest-cov',
            'pytest-mock',
            'pytest-flask',
            'pytest-xdist',
            'pytest-timeout',
            'pytest-randomly',
            'pytest-sugar',
            'factory-boy',
            'faker',
            'coverage',
            'freezegun',
            'responses',
            'psutil',
            'requests-mock',
        ],
    },
) 