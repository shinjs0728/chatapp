from flask import Flask, session
from flask.ext.session import Session
from flask.ext.socketio import SocketIO

socketio = SocketIO()

def create_app(debug=False):
	app = Flask(__name__)
	app.debug = debug
	app.config.from_object('config')

	from .main import main as main_blueprint
	app.register_blueprint(main_blueprint)
	socketio.init_app(app)
	Session(app)
	return app
