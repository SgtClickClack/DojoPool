from setuptools import find_packages, setup

setup(
    name="dojopool",
    version="0.1",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "flask",
        "flask-login",
        "flask-migrate",
        "flask-sqlalchemy",
        "flask-cors",
        "python-dotenv",
    ],
)
