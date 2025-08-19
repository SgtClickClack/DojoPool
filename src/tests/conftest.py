import os
import pytest
from dojopool.app import create_app
from dojopool.core.extensions import db
from flask import Flask
import fakeredis

@pytest.fixture(scope='session')
def app():
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app(config_name='testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def db_session(app):
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        options = dict(bind=connection, binds={})
        session = db.create_scoped_session(options=options)
        db.session = session
        yield session
        transaction.rollback()
        connection.close()
        session.remove()

@pytest.fixture(scope='function')
def redis_client():
    fake_redis = fakeredis.FakeStrictRedis(decode_responses=True)
    yield fake_redis
    fake_redis.flushall() 