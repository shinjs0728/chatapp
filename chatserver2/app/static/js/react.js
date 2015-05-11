
//GLOBAL datas
var DEFAULTSTRING = 'Select a user...';
var formdata = [];
var iddata = [];
var socket = io.connect();

//ID List form
var IDList = React.createClass({
    //When user selects an ID from the idlist
    handleChange: function(event) {
        event.preventDefault();
        var targetid = event.target.value;
        var roomname = sessionStorage["user"]+targetid;
        if(targetid != DEFAULTSTRING && formdata.indexOf(targetid) == -1) { //Check for ID input
            socket.emit('join', roomname);
        }
        return;
    },

    render: function() {
        var divIDListStyle = {
            display: 'inline-block'
        };

        //Add ID to select
        var createID = function(idText, index) {
            return <option key={index + idText}>{idText}</option>;
        };

        return (
            <div style={divIDListStyle}>
                &emsp; Start a Conversation: <select onChange={this.handleChange} disabled={this.props.loginstate}>{this.props.idlist.map(createID)}</select>
            </div>
        );
    }
});

//-----Messages-----
//Single message
var Message = React.createClass({
    render: function() {
        return(
            <div>
                <strong>{this.props.myname}</strong>: {this.props.msg}
            </div>
        );
    }
});

//List of messages
var MessageList = React.createClass({

    closeroom: function() { //When close button is pressed, close it and emit
        var tid = this.props.targetid;
        var roomname = sessionStorage["user"]+tid;
        socket.emit('leave', roomname);
        return;
    },

    render: function(){
        var divFormStyle = {
            height: '150px',
            width: '150px',
            overflow: 'auto',
            wordwrap: 'break-word'
        };
        var divTitleStyle = {
            border: '2px solid black',
            padding: '1px, 1px, 1px',
            overflow: 'hidden'
        };
        var buttonStyle = {
            border: 0,
            float: 'right'
        };

        //Add message to the list
        var renderMessage = function(message, index) {
            return <Message key={message + index} myname={message.myname} msg={message.msg} />
        };

        return (
            <div style={divFormStyle}>
                <div style={divTitleStyle}>
                    {this.props.targetid}<button style={buttonStyle} alignment="right" onClick={this.closeroom}>X</button>
                </div>
                {this.props.mlist.map(renderMessage)}
            </div>
        );
    }
});

//One chat box
var MessageForm = React.createClass({
    getInitialState: function() {

        var tid = this.props.targetid;
        var message_string = sessionStorage.getItem(tid);

        if (message_string == null) {   //Check if previous message exists
            return {mlist: [], msg: '', targetid: tid};
        }
        else {  //If it exists, display the previous chats
            var session_mlist = JSON.parse(message_string);
            return {mlist: session_mlist, msg: '', targetid: tid};
        }
    },

    //When another user sends a message, add it
    receivemsg: function(data) {
        var tid = this.props.targetid;
        var chatname = sessionStorage["user"]+tid;

        if(chatname != data["roomname"]) {  //Ignore chats from other rooms
            return;
        }

        //Handle for the current room only
        var msg = data["msg"];
        var id = msg["myname"];
        var temp_list = [];
        var temp_string = sessionStorage.getItem(id);
        if(temp_string == null) {
            temp_list.push(msg);
        }
        else {
            temp_list = JSON.parse(temp_string);
            temp_list.push(msg);
        }
        sessionStorage[id] = JSON.stringify(temp_list);

        this.setState({mlist: temp_list});
        return;
    },

    //When user enters a chat
    handleSubmit: function(event) {
        event.preventDefault();
        var message = {
            myname: sessionStorage["user"],
            msg: this.state.msg
        };
        var ml = this.state.mlist;
        var tid = this.props.targetid;

        ml.push(message);
        sessionStorage[tid] = JSON.stringify(ml);

        var data = {
            msg: message,
            targetid: tid
        };
        socket.emit('message sent', data);

        this.setState({msg: '', mlist: ml});
        return;
    },

    //chat box text input change handler
    handleChange: function(event) {
        event.preventDefault();
        this.setState({msg: event.target.value});
        return;
    },

    render: function() {
        var divMsgFormStyle = {
            border: '2px solid black',
            padding: '0px 0px 0px',
            display: 'inline-block'
        };
        var inputStyle = {
            width: '100%',
            float: 'bottom'
        };

        var tid = this.props.targetid;
        var mstring = sessionStorage.getItem(tid);
        if (mstring != null) {  //Check if previous chat exists
            var msgs = JSON.parse(mstring);
        }
        else {
            msgs = this.state.mlist;
        }

        return (
            <div style={divMsgFormStyle} id="msg_form">
                <MessageList mlist={msgs} targetid={this.props.targetid}/>
                <form onSubmit={this.handleSubmit}>
                    <input style={inputStyle} onChange={this.handleChange} value={this.state.msg} />
                </form>
            </div>
        );
    }
});

//List of chatboxes
var FormList = React.createClass({
    render: function() {

        var createForm = function(idText, index) {
            return <MessageForm ref={idText} key={index+idText} myname={sessionStorage["user"]} targetid={idText} />;
        };

        return(
            <div>
                <p/>
                {this.props.formlist.map(createForm)}
            </div>
        );
    }
});
//-----Messages-----

//Parent Form
var ChatApp = React.createClass({
	getInitialState: function() {
        socket.emit('init');
        socket.on('init', this.initialize);
        socket.on('get alive', this.imalive);
        socket.on('full list', this.fulllist);
        socket.on('logged in', this.loggedin);
        socket.on('delete form', this.deleteform);
        socket.on('add form', this.addform);
        socket.on('receive message', this.receiveMessage);

        if(sessionStorage.getItem("user") == null) {    //Check if user logged in previously
            return {idname: '', loginstatus: 'Your ID', idlist: iddata, loginstate: false, formlist: formdata};
        }
        else {
            return {idname: '', loginstatus: 'Logged In', idlist: iddata, loginstate: true, formlist: formdata};
        }
	},

    //-----------SOCKET Handlers----------------
    initialize: function(data) {
        iddata = data;
        this.removeme();
        this.setState({idlist: iddata});
        return;
    },

    imalive: function() {   //Tell the server that I'm alive a.k.a. not disconnected
        socket.emit('send user', sessionStorage["user"]);
        return;
    },

    fulllist: function(data) {  //Receive current alive users
        iddata = data;
        this.removeme();
        this.setState({idlist: iddata});
        return;
    },

    deleteform: function(data) {    //Close chatbox
        var targetid = data.replace(sessionStorage["user"], '');
        var index = formdata.indexOf(targetid);
        formdata.splice(index, 1);
        this.setState({formlist: formdata});
        return;
    },

    addform: function(data) {   //Add chatbox
        var targetid = data.replace(sessionStorage["user"], '');
        formdata.push(targetid);
        this.setState({formlist: formdata});
        return;
    },

    receiveMessage: function(data) {    //Receive message handler (call child function)
        var msg = data["msg"];
        var tid = msg["myname"];
        var myname = sessionStorage["user"];
        var reftid = this.refs[myname];
        reftid.refs[tid].receivemsg(data);
        return;
    },
    //------------End of SOCKET Handlers-------------

    //Helper Function - removes my name from user list
    removeme: function() {
        if(iddata.indexOf(DEFAULTSTRING) == -1) {
            iddata.unshift(DEFAULTSTRING);
        }
        if(sessionStorage.getItem("user") != null) {
            var myindex = iddata.indexOf(sessionStorage["user"]);
            iddata.splice(myindex, 1);
        }
        return;
    },

    //ID text input change handler
    handleIDChange: function(event) {
        event.preventDefault();
        this.setState({idname: event.target.value});
        return;
    },

    //When id is submitted
	handleSubmit: function(event) {
		event.preventDefault();
        var curid = this.state.idname;

        if(curid == DEFAULTSTRING || curid.trim() == '') { //Check for valid id input
            this.setState({idname: '', loginstatus: 'Invalid ID', loginstate: false})
            return;
        }
        else { //If valid, login and check if it exists in the list
            sessionStorage["user"] = curid;
            socket.emit('check id', curid);
            return;
        }
	},

    //When a possible valid id input has been made
    loggedin: function(data) {
        var status;
        if(data.loginstate) {   //If ID is unique, add to list
            status = 'Logged in';
            iddata = data.idlist;
            this.removeme();
            this.imalive();
        }
        else {  //If ID is not unique, do not add
            sessionStorage["user"] = null;
            status = 'Invalid ID';
        }
        this.setState({idname: '', loginstatus: status, idlist: iddata, loginstate: data.loginstate});
        return;
    },

	render:function() {
        var divLoginStyle = {
            border: '2px solid black',
            padding: '15px 20px 0px',
            display: 'inline-block'
        };
        var flcheck = this.state.formlist;
		return (
            <div>
                <div style={divLoginStyle}>
			        <form id="login" onSubmit={this.handleSubmit}>
                        Hi, and welcome {sessionStorage["user"]}
                        <br/>
                        Name: <input type="text" id="id" value={this.state.idname} placeholder={this.state.loginstatus} onChange={this.handleIDChange} readOnly={this.state.loginstate} />
                        <IDList idlist={this.state.idlist} loginstate={!this.state.loginstate} />
					</form>
                </div>
                <FormList ref={sessionStorage["user"]} formlist={this.state.formlist} />
            </div>
	  	);
	}
});

React.render(
	<ChatApp />,
	document.body
);