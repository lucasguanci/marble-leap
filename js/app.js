var particle = new Particle();
var token = "e288cfdb30758d702a08105037aaa18cf32ac4db";

/**
 * Devices
 */
 // clock
var params = {
  name: "clock",
  id: "2c0020000a47343432313031",
  variables: {
    status: "clockStatus"
  },
  events: {
    statusChanged: "clockStatusChanged",
    switching: "clockSwitching"
  },
  switch: "clockSwitch"
}
var clock = new Device(params);

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
   particle.login({username: 'luca.sguanci@gmail.com', password: 'London#2012'})
     .then(function(data){
       console.log('API call completed on promise resolve: ', data.body.access_token);
       // init devices
       clock.init();
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
     this.setStatus();
     this.statusChanged(this.events.statusChanged);
     this.bindSwitch(this.switch);
     window.setInterval(this.checkConnection, 10000, this);
   }
 }
