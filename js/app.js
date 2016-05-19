var particle = new Particle();
var token = "e01ac33b287dafe5f610a76532a0f1875d7a7fb2";

/**
 * Devices
 */
 // clock
var params = {
  name: "oro",
  id: "260030000d47343432313031",
  variables: {
    status: "oroStatus"
  },
  events: {
    statusChanged: "oroStatusChanged",
    switching: "oroSwitching"
  },
  switch: "oroSwitch"
}
var clock = new Device(params);
// lamp
var params = {
 name: "lamp",
 id: "22002e000947343432313031",
 variables: {
   status: "lampStatus"
 },
 events: {
   statusChanged: "lampStatusChanged",
   switching: "lampSwitching"
 },
 switch: "lampSwitch"
}
var lamp = new Device(params);
// board
var params = {
 name: "board",
 id: "1e001f000747343337373738",
 variables: {
   status: "boardStatus"
 },
 events: {
   statusChanged: "boardStatusChanged",
   switching: "boardSwitching"
 },
 switch: "boardSwitch"
}
var board = new Device(params);
// echo
var params = {
 name: "led",
 id: "1e001f000747343337373738",
 variables: {
   status: "ledStatus"
 },
 events: {
   statusChanged: "ledStatusChanged",
   switching: "ledSwitching"
 },
 switch: "ledSwitch"
}
var echo = new Device(params);

/**
 * Main
 */
$(document).ready(function(){
  // connect to Particle's cloud and init the script
  connectParticle();
});

/**
 * Functions
 */
 // connect to Particle
 function connectParticle() {
   particle.login({username: 'valentina.lapolla@gmail.com', password: 'mocamboiot30'})
     .then(function(data){
       console.log('API call completed on promise resolve: ', data.body.access_token);
       // init devices
       clock.init();
       lamp.init();
       board.init();
       echo.init();
     },
     function(err) {
       console.log('API call completed on promise fail: ', err);
     })
 }

// Device constructor
 function Device(params) {
   this.name = params.name;
   this.id = params.id;
   this.connected = null;
   this.variables = params.variables;
   this.events = params.events;
   this.switch = params.switch;
   this.status = null;
   this.getStatus = function() {
     var self = this;
     particle.getVariable(
       { deviceId: this.id, name: this.variables.status, auth: token }
     ).then(
       function(data){
         self.status = data.body.result;
         if ( self.status == "on" ) {
           console.log(self.name+" is switched on.")
         } else {
           console.log(self.name+" is switched off.")
         }
       },
       function(err){
         console.log('Can\'t retrieve '+self.name+' status, ', err);
       }
     );
   };
   this.setStatus = function() {
     var self = this;
     particle.getVariable(
       { deviceId: this.id, name: this.variables.status, auth: token }
     ).then(
       function(data){
         self.status = data.body.result;
         if ( self.status == "on" ) {
           console.log(self.name+" is switched on.")
           $('input[name="'+self.switch+'"]').bootstrapSwitch('state', true, true);
         } else {
           console.log(self.name+" is switched off.")
           $('input[name="'+self.switch+'"]').bootstrapSwitch('state', false, true);
         }
       },
       function(err){
         console.log('Can\'t set '+self.name+' status, ', err);
       }
     );
   };
   this.checkConnection = function(that) {
     var url = "https://api.particle.io/v1/devices/"+that.id+"\?access_token\="+token;
     var self = that;
     $.get(url, function(data){
       if ( data.connected ) {
         self.connected = true;
         console.log(self.name+" is connected.");
         $("div.device-"+self.name).css("opacity",1);
       } else {
         self.connected = false;
         console.log(self.name+" is not connected.");
         $("div.device-"+self.name).css("opacity",0.4);
       }
     });
   };
   this.statusChanged = function(eventName) {
     var self = this;
     particle.getEventStream({ deviceId: this.id, name: eventName, auth: token })
       .then(function(stream){
         stream.on('event', function(data) {
           console.log(self.name+" received "+eventName+" event.");
           self.setStatus();
         })
       }
     );
   };
   this.publish = function(eventName) {
     var self = this;
     particle.publishEvent(
       {name: eventName, data: {}, auth: token }
     ).then(
       function(){
         console.log(self.name+" has published "+eventName+" event.");
       },
       function(err) {
         console.log("Can't publish "+eventName+" event, err: "+err);
       }
     );
   };
   this.bindSwitch = function(switchName) {
     var self = this;
     // init switch
     $("input[name='"+switchName+"']").bootstrapSwitch();
     // bind events
     $("input[name='"+switchName+"']").on('switchChange.bootstrapSwitch', function(event,state){
       self.publish(self.events.switching);
     });
   };
   this.init = function() {
     this.checkConnection(this);
     if ( this.name != "led" ) {
       this.setStatus();
       this.statusChanged(this.events.statusChanged);
     }
     this.bindSwitch(this.switch);
     window.setInterval(this.checkConnection, 10000, this);
   };
 }
