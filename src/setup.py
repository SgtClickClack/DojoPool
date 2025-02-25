from setuptools import find_packages, setup

setup(
    name="dojopool",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "Flask>=3.0.2",
        "Flask-Login>=0.6.3",
        "Flask-SQLAlchemy>=3.1.1",
        "Flask-SocketIO>=5.3.6",
        "python-dotenv>=1.0.1",
        "eventlet>=0.35.2",
    ],
    python_requires=">=3.8",
)
