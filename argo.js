var Quaternion = function(a, b, c, d){
    var t = this;
    if(!(t instanceof Quaternion)){
        return new Quaternion(a, b, c, d);
    }
    this.a = (a ? a : 0);
    this.b = (b ? b : 0);
    this.c = (c ? c : 0);
    this.d = (d ? d : 0);

    this.add = function(){ //variable args
        var args = [ this ];
        for(var i = 0; i < arguments.length; i++){
            args.push(arguments[i]);
        }
        return Quaternion.sum.apply(null, args);
    }
    this.multiply = function(){ //variable args
        var args = [ this ];
        for(var i = 0; i < arguments.length; i++){
            args.push(arguments[i]);
        }
        return Quaternion.product.apply(null, args);
    }
    this.premultiply = function(){
        var args = [];
        for(var i = 0; i < arguments.length; i++){
            args.push(arguments[i]);
        }
        args.push(this);
        return Quaternion.product.apply(null, args);
    }
    this.scale = function(k){ //same as multiplying by (k,0,0,0)
        return new Quaternion(k*this.a, k*this.b, k*this.c, k*this.d);
    }
    this.conjugate = function(){
        return new Quaternion(this.a, -this.b, -this.c, -this.d);
    }
    this.norm = function(){
        return Math.sqrt( this.sqNorm() );
    }
    this.length = this.norm;
    this.sqNorm = function(){
        return this.a*this.a + this.b*this.b + this.c*this.c + this.d*this.d;
    }
    this.unit = function(){
        if(this.sqNorm() > 0){
            return this.scale(1 / this.norm());
        }
    }
	this.normalise = this.unit;
    this.versor = this.unit; //synonym
    this.dot = function(q){
        if(q instanceof Quaternion){
            return this.a * q.a + this.b * q.b + this.c * q.c + this.d * q.d;
        } else {
            throw TypeError("Argument is not a Quaternion");
        }
    }
}
Quaternion.sum = function(){
    var r = new Quaternion(0, 0, 0, 0);
    
    function add(p, q){
        var ra = p.a + q.a;
        var rb = p.b + q.b;
        var rc = p.c + q.c;
        var rd = p.d + q.d;
        return new Quaternion(ra, rb, rc, rd);
    }

    for(var i = 0; i < arguments.length; i++){
        if(arguments[i] instanceof Quaternion){
            var q = arguments[i];
            r = add(r, q);
        } else if(isNumeric(arguments[i])){
            var q = new Quaternion(arguments[i]);
            r = add(r, q);
        } else {
            throw TypeError("Not all arguments are Quaternions");
        }
    }
    return r;
}
Quaternion.product = function(){
    var r = new Quaternion(1, 0, 0, 0);

    function hProduct(p, q){
        var ra = p.a * q.a - p.b * q.b - p.c * q.c - p.d * q.d;
        var rb = p.a * q.b + p.b * q.a + p.c * q.d - p.d * q.c;
        var rc = p.a * q.c - p.b * q.d + p.c * q.a + p.d * q.b;
        var rd = p.a * q.d + p.b * q.c - p.c * q.b + p.d * q.a;
        return new Quaternion(ra, rb, rc, rd);
    }

    for(var i = 0; i < arguments.length; i++){
        if(arguments[i] instanceof Quaternion){
            var q = arguments[i];
            r = hProduct(r, q);
        } else if(isNumeric(arguments[i])){
            var q = new Quaternion(arguments[i]);
            r = hProduct(r, q);
        } else {
            throw TypeError("Not all arguments are Quaternions");
        }
    }
    return r;
}
Quaternion.fromAxisAngle = function(axis, angle){
    return new Quaternion( Math.cos(angle/2), Math.sin(angle/2) * axis[0], Math.sin(angle/2) * axis[1], Math.sin(angle/2) * axis[2]);
}
Quaternion.applyRotation = function(q, vec){
    if(q instanceof Quaternion){
        q = q.unit();
        var p = new Quaternion(0, vec[0], vec[1], vec[2]);
        var v = q.multiply(p).multiply(q.conjugate());
        return [v.b, v.c, v.d];
    } else {
        throw TypeError("q is not a Quaternion");
    }
    
}
Quaternion.slerp = function(q0, q1, t){
	var v0 = q0.normalise();
	var v1 = q1.normalise();
	var threshold = 0.9995;
	
	var dot = v0.dot(v1);
	if(dot < 0){
		v1 = v1.scale(-1);;
		dot = -dot;
	}
	if(dot > threshold){
		return Quaternion.nlerp(v0, v1, t);
	}
	dot = Math.min( Math.max(dot, -1), 1);
	var Omega = Math.acos(dot);
	var s0 = Math.sin((1-t)*Omega) / Math.sin(Omega);
	var s1 =  Math.sin(t*Omega) / Math.sin(Omega);
	
	var r0 = v0.scale(s0);
	var r1 = v0.scale(s1);
	
	var result = r0.add(r1);
	return result.normalise();
}
Quaternion.nlerp = function(q0, q1, t){
	var v0 = q0.normalise();
	var v1 = q1.normalise();
	
	var dot = v0.dot(v1);
	if(dot < 0){
		v1 = v1.scale(-1);;
		dot = -dot;
	}
	
	var result = v0.add( ( v1.add(v0.scale(-1)) ).scale(t) );
	return result.normalise();
}

function isObject(obj) {
    return obj === Object(obj);
}
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var Argo = new function() {

    this.getHorizontalCoords = function(ra, dec, now, loc){
        var lst = localMST(now, loc.lat, loc.long); //in hours
        var H = (lst*15 - ra)* Math.PI/180; //deg to radians
        var q = loc.lat* Math.PI/180; //deg to radians
        var d = dec * Math.PI/180; //deg to radians
        var alt = Math.asin(Math.sin(q)*Math.sin(d) + Math.cos(q)*Math.cos(d)*Math.cos(H)); //currently in radians
        var azi = Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(q) - Math.tan(d)*Math.cos(q)); //currently in radians
        
        var x = Math.cos(alt)*Math.sin(azi);
        var y = Math.cos(alt)*Math.cos(azi);
        var z = Math.sin(alt);
        return [x, y, z];
    }
	
	this.getRotatedCoords = function(ra, dec, now, loc, view){
		var pos = this.getHorizontalCoords(ra, dec, now, loc);
        var newpos = Quaternion.applyRotation(view.rot, pos);
		
		return newpos;
	}

    this.getProjectedLocation = function(ra, dec, now, loc, view){
        var newpos = this.getRotatedCoords(ra, dec, now, loc, view);
        
        var xx = 2*newpos[0] /(1+newpos[2]) * view.zoom;
        var yy = 2*newpos[1] /(1+newpos[2]) * view.zoom;
        return {'x': xx, 'y': yy};
        
    }
	
	this.getProjectedCircle = function(ra, dec, diameter, now, loc, view){
		var newpos = this.getRotatedCoords(ra, dec, now, loc, view);
		var rawDiameter = diameter * Math.PI/(60 * 180);
				
        var xx = 2*newpos[0] /( Math.cos(rawDiameter) +newpos[2]) * view.zoom;
        var yy = 2*newpos[1] /( Math.cos(rawDiameter) +newpos[2]) * view.zoom;
		var angularDiameter = 2*Math.sin(rawDiameter)/(Math.cos(rawDiameter) + newpos[2]) * view.zoom;
        return {'x': xx, 'y': yy, 'ad': angularDiameter};
	}


    function Star(starData) {
        var t = this;
        if(!(t instanceof Star)){
            return isObject(starData) ? new Star(starData) : new Star();
        }
        var props = {
            "ra" : 0,
            "dec" : 0,
            "spectral" : "default",
            "bv" : 0,
            "mag" : 0
        }
        for(var p in props){
            if(isObject(starData) && (p in starData)){
                this[p] = starData[p];
            } else{
                this[p] = props[p];
            }
        }
        // this.ra = starData.ra;
        // this.dec = starData.dec;
        // this.spectral = starData.spectral;
        // this.mag = starData.mag;
		
		this.colourFromBV = Star.colourFromBV(this.bv);

        this.draw = function(now, loc, view, ctx){
            var coords = Argo.getProjectedLocation(this.ra, this.dec, now, loc, view);
			var w = ctx.canvas.width; var h = ctx.canvas.height;
			var vmin = Math.min(w,h); var vmax = Math.max(w, h); var ratio = vmax/vmin;
			if(Math.abs(coords.x) > ratio || Math.abs(coords.y) > ratio){
				return;
			} else {
				var left = (w + coords.x*vmin)/2;
				var top = (h + coords.y*vmin)/2;
				var d =(6 - this.mag) * Math.sqrt(view.zoom);
				var colour = Star.spectrals[this.spectral];
				//var colour = this.colourFromBV;
				ctx.beginPath();
				ctx.fillStyle=colour;
				ctx.arc(left,top,d/2,0,2*Math.PI);
				ctx.fill();
				ctx.closePath();
			}
			
        }
    }

    Star.spectrals = {
        "W" : "hsla(240,80%,70%,1)",
        "O" : "hsla(225,80%,75%,1)",
        "B" : "hsla(200,85%,85%,1)",
        "A" : "hsla(120,100%,100%,1)",
        "F" : "hsla(65,85%,90%,1)",
        "G" : "hsla(60,80%,85%,1)",
        "K" : "hsla(45,80%,80%,1)",
        "M" : "hsla(35,75%,75%,1)",
        "C" : "hsla(30,70%,70%,1)",
        "default" : "white",
        "white" : "white",
        "black" : "black"
    }

    Star.colourFromBV = function(bv){
        var T = 4600 * ( 1/(0.92*bv + 1.7) + 1/(0.92*bv + 0.62) );

        var x = (function(T){
            T = Math.min(T, 25000);
            T = Math.max(T, 1667);
            var b = 1000/T;
            if(T >= 1667 && T <= 4000){
                return (-0.2661239) * b * b * b + (-0.2343580) * b * b + (0.8776956) * b + (0.179910)
            } else if (T > 4000){
                return (-3.0258469) * b * b * b + (2.1070379) * b * b + (0.2226347) * b + (0.240390)
            }
        } )(T);
        var y = (function(T, x){
            T = Math.min(T, 25000);
            T = Math.max(T, 1667);
            if(T >= 1667 && T <= 2222){
                return (-1.1063814) * x * x * x + (-1.34811020) * x * x + (2.18555832) * x + (-0.20219683)
            } else if (T > 2222 && T <= 4000){
                return (-0.9549476) * x * x * x + (-1.37418593) * x * x + (2.09137015) * x + (-0.16748867)
            } else if (T > 4000){
                return (3.0817580) * x * x * x + (-5.87338670) * x * x + (3.75112997) * x + (-0.37001483)
            }
        } )(T, x);

        var yy = 1;
        var xx = (y == 0)? (0.31271/0.32902) : x / y;
        var zz = (y == 0)? ((1 - 0.31271 - 0.32902)/0.32902) : (1 - x - y)/y;

        var rl = (3.2406) * xx + (-1.5372) * yy + (-0.4986) * zz;
        var gl = (-0.9689) * xx + (1.8758) * yy + (0.0415) * zz;
        var bl = (0.0557) * xx + (-0.2040) * yy + (1.0570) * zz;

        function gc(cl){
            if(cl <= 0.0031308){
                return 12.92 * cl;
            } else {
                return (1 + 0.055) * Math.pow(cl, 1/2.4) - 0.055;
            }
        }

        var r = gc(rl);
        var g = gc(gl);
        var b = gc(bl);

        var max = Math.max(r, g, b);
        var arr = [255, 255, 255];
        if(max > 0){
            arr = [r,g,b];
            for(var i = 0; i < arr.length; i++){
                arr[i] = Math.round( Math.max( Math.min( arr[i] * 255 / max, 255), 0));
            }
        }
        return "rgb(" + arr.join(",") + ")";
    }

    function Messier(messierData){
        var t = this;
        if(!(t instanceof Messier)){
            return isObject(messierData) ? new Messier(messierData) : new Messier();
        }
        var props = {
            "ra" : 0,
            "dec" : 0,
            "diameter" : 0
        }
        for(var p in props){
            if(isObject(messierData) && (p in messierData)){
                this[p] = messierData[p];
            } else{
                this[p] = props[p];
            }
        }
        // this.ra = messierData.ra;
        // this.dec = messierData.dec;
        // this.diameter = messierData.diameter;
		
		this.draw = function(now, loc, view, ctx){
            var coords = Argo.getProjectedCircle(this.ra, this.dec, this.diameter, now, loc, view);
			var w = ctx.canvas.width; var h = ctx.canvas.height;
			var vmin = Math.min(w,h); var vmax = Math.max(w, h); var ratio = vmax/vmin;
			if(Math.abs(coords.x) > ratio || Math.abs(coords.y) > ratio){
				return;
			} else {
				var left = (w + coords.x*vmin)/2;
				var top = (h + coords.y*vmin)/2;
				var d = coords.ad * vmin/2;
				var colour = "red";
				ctx.beginPath();
				ctx.strokeStyle=colour;
				ctx.arc(left,top,d/2,0,2*Math.PI);
				ctx.stroke();
				ctx.closePath();
			}
			
        }
    }

    this.stars = [];
    this.messiers = [];

    this.fps = 30;
    this.workerID = null;
	this.viewRotSpeed = 15 * Math.PI/180; //rad per second
	this.viewZoomSpeed = 2; //factor per second
	this.viewZoomMin = 0.25;
	this.viewZoomMax = 10;
	
	this.viewShiftDuration = 1; //second;
	this.viewShiftCountdown = 0;
	
	this.canvas = null;
	this.ctx = null;
	this.activeKeys = [];
	
	function loadData(_argo, data){
        if(isObject(data)){
            if("stars" in data){
                for(s of data["stars"]){
                    _argo.stars.push( new Star(s) );
                }
            }

            if("messiers" in data){
                for(m of data["messiers"]){
                    _argo.messiers.push( new Messier(m) );
                }
            }
        }
    }
	
    this.initialise = function(){
        loadData(this, data);
        this.time = new Date();
        this.loc = {
            'lat' : 0, //positive northwards
            'long' : 0 //positive westwards
        }
        this.view = {
            'rot' : new Quaternion(1, 0, 0, 0),
            'zoom' : 1
        }
		this.canvas = document.getElementsByTagName("canvas"); //HTMLCollection; access members by id name
		for(var i = 0; i < this.canvas.length; i++){
			this.resizeCanvas(this.canvas[i], window.innerWidth, window.innerHeight);
			if(!this.ctx){
				this.ctx = {};
			}
			this.ctx[ this.canvas[i].id ] = this.canvas[i].getContext("2d");
		}
		
		
		window.addEventListener("keydown", function(evt){
			var i = Argo.activeKeys.indexOf(evt.keyCode);
			if(i < 0){
				Argo.activeKeys.push(evt.keyCode);
			}
		});
		window.addEventListener("keyup", function(evt){
			var i = Argo.activeKeys.indexOf(evt.keyCode);
			if(i >= 0){
				Argo.activeKeys.splice(i,1);
			}
		});
		window.addEventListener("resize", function(evt){
			windowResize();
		});

        this.workerID = window.setInterval( (function(_t){
            return function(){
                _t.timeStep();
            }
        })(this), Math.floor(1000/this.fps) );
    }
	function windowResize(){
		for(var i = 0; i < Argo.canvas.length; i++){
			Argo.resizeCanvas(Argo.canvas[i], window.innerWidth, window.innerHeight);
		}
	}
	
	this.resizeCanvas = function(canvas, width, height){
		canvas.width = width;
		canvas.height = height;
	}

    this.timeStep = function(){
        this.time = new Date();
        var now = this.time;
		handleView(this.activeKeys);
        this.draw(now);
    }

    this.draw = function(now){
		//clear canvases
		for(var c in this.ctx){
			var ctx = this.ctx[c];
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}
		
		//handle each layer
        for(var i = 0; i < this.stars.length; i++){
            this.stars[i].draw(now, this.loc, this.view, this.ctx["stars"]);
        }
		
		for(var i = 0; i < this.messiers.length; i++){
            this.messiers[i].draw(now, this.loc, this.view, this.ctx["messiers"]);
        }
    }
	
	function handleView(keyCodes){
		if(Argo.viewShiftCountdown > 0){
			shiftView();
		} else {
			handleViewKeys(keyCodes);
		}
	}
	
	function handleViewKeys(keyCodes){
		var isShiftActive = 0;
		if(keyCodes.indexOf(16)>=0){ //shift
			isShiftActive = 1;
		}
		for(var i = 0; i < keyCodes.length; i++){
			var code = keyCodes[i];
			var zoom = Math.pow(Argo.viewZoomSpeed, 1/Argo.fps);
			var angle = (Argo.viewRotSpeed / Argo.fps)/ Argo.view.zoom * (1 + isShiftActive);
			switch(code){
				case 90: //z
					Argo.view.zoom = Math.min(Argo.viewZoomMax, Argo.view.zoom * zoom);
					break;
				case 88: //x
					Argo.view.zoom = Math.max(Argo.viewZoomMin, Argo.view.zoom / zoom);
					break;
				case 37: //left
				case 65: //a
					var q = Quaternion.fromAxisAngle([0,1,0], angle);
					Argo.view.rot = Argo.view.rot.premultiply(q);
					break;
				case 39: //right
				case 68: //d
					var q = Quaternion.fromAxisAngle([0,1,0], -angle);
					Argo.view.rot = Argo.view.rot.premultiply(q);
					break;
				case 38: //up
				case 87: //w
					var q = Quaternion.fromAxisAngle([1,0,0], -angle);
					Argo.view.rot = Argo.view.rot.premultiply(q);
					break;
				case 40: //down
				case 83: //s
					var q = Quaternion.fromAxisAngle([1,0,0], angle);
					Argo.view.rot = Argo.view.rot.premultiply(q);
					break;
				case 81: //q
					var q = Quaternion.fromAxisAngle([0,0,1], -angle);
					Argo.view.rot = Argo.view.rot.premultiply(q);
					break;
				case 69: //e
					var q = Quaternion.fromAxisAngle([0,0,1], angle);
					Argo.view.rot = Argo.view.rot.premultiply(q);
					break;
				case 82: //r
					startShiftReset();
					break;
			}
		}
		
	}
	
	function zoomView(keyCodes){
		
	}
	
	function rotateView(keyCodes){
		for(var i = 0; i < keyCodes.length; i++){
			var code = keyCodes[i];
			var angle = Argo.viewRotSpeed / Argo.fps;
			angle /= Argo.view.zoom;
			switch(code){
				
			}
		}
	}
	
	function startShiftView(startRot, endRot, startZoom, endZoom){
		Argo.view.startRot = startRot;
		Argo.view.endRot = endRot;
		Argo.view.startZoom = startZoom;
		Argo.view.endZoom = endZoom;
		Argo.viewShiftCountdown = Argo.viewShiftDuration * Argo.fps;
	}
	function startShiftReset(){
		startShiftView(Argo.view.rot, new Quaternion(1,0,0,0), Argo.view.zoom, 1);
	}
	
	function shiftView(){
		if(Argo.viewShiftCountdown > 0){
			Argo.viewShiftCountdown -= 1;
			var t = 1 - ( Argo.viewShiftCountdown / (Argo.viewShiftDuration * Argo.fps) );
			t = Math.min( Math.max(t, 0), 1);
			var x = (function smooth(t){
				if(t>0.5){
					return 1 - 2*(1-t)*(1-t);
				} else {
					return 2*t*t;
				}
			})(t);
			if(!(Argo.view.startRot && Argo.view.endRot)){
				endShiftView();
				startShiftReset();
				return;
			} else {
				Argo.view.rot = Quaternion.nlerp(Argo.view.startRot, Argo.view.endRot, x);
				Argo.view.zoom = (function(startZoom, endZoom, t){
					if(!(startZoom > 0)){
						startZoom = 1;
					}
					if(!(endZoom > 0)){
						endZoom = 1;
					}
					return startZoom * Math.pow(endZoom/startZoom, t); 
				})(Argo.view.startZoom, Argo.view.endZoom, x);
			}
		} else {
			Argo.view.rot = Argo.view.endRot;
			Argo.view.zoom = Argo.view.endZoom;
			endShiftView();
		}
	}
	
	function endShiftView(){
		
		Argo.view.startRot = null;
		Argo.view.endRot = null;
		Argo.view.startZoom = null;
		Argo.view.endZoom = null;
		Argo.viewShiftCountdown = 0; //just be sure
	}

    function julianDay(theDate) {
        var Y = theDate.getUTCFullYear();
        var M = theDate.getUTCMonth();
        var D = theDate.getUTCDate(); + (theDate.getUTCHours() + theDate.getUTCMinutes()/60 + theDate.getUTCSeconds()/3600 + theDate.getUTCMilliseconds()/3600000)/24;
        if(M<3){
            M = M+12;
            Y = Y-1;	
        }
        var A = Math.floor(Y/100);
        var B = 2 - A + Math.floor(A/4);
        return Math.floor(365.25 * (Y+4716)) + Math.floor(30.6001 * (M+1)) + D + B - 1524.5;
        
    };
    function zeroJD(theDate) {
        var Y = theDate.getUTCFullYear();
        var M = theDate.getUTCMonth()+1;
        var D = theDate.getUTCDate();
        if(M<3){
            M = M+12;
            Y = Y-1;	
        }
        var A = Math.floor(Y/100);
        var B = 2 - A + Math.floor(A/4);
        return Math.floor(365.25 * (Y+4716)) + Math.floor(30.6001 * (M+1)) + D + B - 1524.5;
        
    };
    function greenwichMST(now){
        //var now = new Date();
        var zh = now;
        var pod = zh.getUTCHours() + zh.getUTCMinutes()/60 + zh.getUTCSeconds()/3600 + zh.getUTCMilliseconds()/3600000
        var T = (zeroJD(zh) - 2451545.0)/36525;
        var mstz = 6 + 41/60 + 50.54841/3600 + 8640184.812866*T/3600 + 0.093104*T*T/3600 - 0.0000062*T*T*T/3600; //hours
        var mst = (mstz + pod*1.00273790935)%24;
        return mst;
    };

    function localMST(now, lat, long){
        return (greenwichMST(now) - long/15)%24;
    }


}();

window.onload = function(){
    Argo.initialise();
}