from setuptools import setup, find_packages

setup(
    name="dojo_pool",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'pytest',
        'pytest-asyncio',
        'pytest-cov',
        'pytest-mock',
        'aiohttp',
        'motor',
        'pymongo',
        'python-dotenv',
        'PyJWT'
    ]
) 