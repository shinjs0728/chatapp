from flask import Flask, request, render_template, session
from flask.ext.socketio import emit, join_room, leave_room
from .. import socketio
from . import main

idlist = []
chat_msg = ""
listlen = 0

@main.route('/')
def index():
	return render_template('index.html')

@socketio.on('init')
def init():
	emit('init', idlist)

@socketio.on('check id')
def checkid(userid):
	global idlist, listlen

	if userid not in idlist:
		idlist.append(userid)
		listlen += 1
		login_data = {"idlist": idlist, "loginstate": True}
	else:
		login_data = {"idlist": idlist, "loginstate": False}
	emit('logged in', login_data)

@socketio.on('disconnect')
def disconnect():
	global idlist, listlen

	idlist = []
	if listlen > 0:
		listlen -= 1
	emit('get alive', broadcast=True)

@socketio.on('send user')
def updatelist(userid):
	global idlist
	if userid not in idlist:
		idlist.append(userid)
	if len(idlist) == listlen:
		emit('full list', idlist, broadcast=True)

@socketio.on('join')
def on_join(roomname):
	join_room(roomname)
	emit('add form', roomname)

@socketio.on('leave')
def on_leave(roomname):
	leave_room(roomname)
	emit('delete form', roomname)

@socketio.on('message sent')
def handlemsg(data):
	msg = data["msg"]
	roomname = data["targetid"]+msg["myname"]
	msg_data = {"msg": msg, "targetid": data["targetid"], "roomname": roomname}
	emit('receive message', msg_data, room=roomname)


