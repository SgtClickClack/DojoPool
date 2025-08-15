from setuptools import setup, find_packages

setup(
    name="dojopool",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "flask>=3.0.0",
        "flask-sqlalchemy>=3.0.0",
        "flask-migrate>=4.0.0",
        "flask-login>=0.6.0",
        "flask-cors>=4.0.0",
        "flask-debugtoolbar>=0.16.0",
        "firebase-admin>=6.0.0",
        "python-dotenv>=1.0.0",
        "sqlalchemy>=2.0.0",
        "werkzeug>=3.0.0",
    ],
    python_requires=">=3.8",
) 