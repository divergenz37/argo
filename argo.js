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
Quaternion.fromTwoVectors = function(u, v){
    var threshold = 0.9995;
    var dot = u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
    var nu = Math.sqrt(u[0]*u[0] + u[1]*u[1] + u[2]*u[2]);
    var nv = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    var w = [ u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0] ];
    if(dot < (-threshold * nu * nv)){
        w = Math.abs(u[0]) > Math.abs(u[2]) ? [-u[1], u[0], 0] : [0, -u[2], u[1]];
        return (new Quaternion(0, w[0], w[1], w[2])).normalise();
    } else {
        var q = new Quaternion(dot, w[0], w[1], w[2]);
        q.a += q.norm();
        return q.normalise();
    }
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
    var r1 = v1.scale(s1);
    
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

    //Star object

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
                var d = (6 - this.mag) * Math.sqrt(view.zoom);
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

    //Messier object

    function Messier(messierData){
        var t = this;
        if(!(t instanceof Messier)){
            return isObject(messierData) ? new Messier(messierData) : new Messier();
        }
        var props = {
            "ra" : 0,
            "dec" : 0,
            "diameter" : 0 //arcmin
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
            var coords = Argo.getProjectedCircle(this.ra, this.dec, this.diameter/(2 * 60), now, loc, view);
            var w = ctx.canvas.width; var h = ctx.canvas.height;
            var vmin = Math.min(w,h); var vmax = Math.max(w, h); var ratio = vmax/vmin;
            if(Math.abs(coords.x) > (ratio + coords.ar) || Math.abs(coords.y) > (ratio + coords.ar)){
                return;
            } else {
                var left = (w + coords.x*vmin)/2;
                var top = (h + coords.y*vmin)/2;
                var ar = coords.ar * vmin/2;
                var colour = "red";
                ctx.beginPath();
                ctx.strokeStyle=colour;
                ctx.arc(left,top,ar,0,2*Math.PI);
                ctx.stroke();
                ctx.closePath();
            }
            
        }
    }

    //Grid circle object
    function GridObj(){
        this.plane = {
            'a' : 0,
            'b' : 0,
            'c' : 0,
            'd' : 0
        };
        this.setPlane = function(normal, point){
            this.plane.a = normal[0];
            this.plane.b = normal[1];
            this.plane.c = normal[2];
            this.plane.d = normal[0] * point[0] + normal[1] * point[1] + normal[2] * point[2];
            return this.plane;
        };
        this.getShape = function(view){
            var tolerance = 0.001;
            if(Math.abs(this.plane.c + this.plane.d) < tolerance){
                //line, Ax + By = C. 4ax + 4by = 4(c-d)
                var A = 4 * this.plane.a / view.zoom;
                var B = 4 * this.plane.b / view.zoom;
                var C = 4 * (this.plane.c - this.plane.d);
                return new Line(A, B, C);
            } else {
                //circle, (x - xc)^2 + (y - yc)^2 = r^2. xc = -2a/(c+d), yc = -2b/(c+d), r = 2sqrt(a^2 + b^2 + c^2 - d^2)/(c+d)
                var xc = - (2 * this.plane.a)/(this.plane.c + this.plane.d) * view.zoom;
                var yc = - (2 * this.plane.b)/(this.plane.c + this.plane.d) * view.zoom;
                var r = Math.abs( (2 * Math.sqrt(this.plane.a * this.plane.a + this.plane.b * this.plane.b + this.plane.c * this.plane.c - this.plane.d * this.plane.d))/(this.plane.c + this.plane.d) * view.zoom );
                return new Circle(xc, yc, r);
            }
        };
        this.calculatePlane = function(now, loc, view, ctx){
            this.setPlane([0,0,1],[0,0,0]);
        };
        this.draw = function(now, loc, view, ctx){
            this.calculatePlane(now, loc, view, ctx);
            var shape = this.getShape(view);
            if("draw" in shape){
                shape.draw(view, ctx, this.colour);
            }
        };
        this.colour = "green";

        function Line(A, B, C){
            //Ax + By = C
            this.A = A || 0;
            this.B = B || 0;
            this.C = C || 0;
            
            this.draw = function(view, ctx, colour){
                var w = ctx.canvas.width; var h = ctx.canvas.height;
                var vmin = Math.min(w,h); var vmax = Math.max(w, h); var ratio = vmax/vmin;
                var tolerance = 0.001;

                if(Math.abs(this.A) < tolerance && Math.abs(this.B) < tolerance){
                    return;
                } else if (Math.abs(this.A) < tolerance){ //By = C
                    var yintercept = this.C / this.B;
                    if(Math.abs(yintercept) > ratio){
                        return;
                    }
                    var top = (h + yintercept*vmin)/2;
                    ctx.beginPath();
                    ctx.strokeStyle=colour;
                    ctx.moveTo(0, top);
                    ctx.lineTo(w, top);
                    ctx.stroke();
                    ctx.closePath();
                } else if (Math.abs(this.B) < tolerance){ //Ax = C
                    var xintercept = this.C / this.A;
                    if(Math.abs(xintercept) > ratio){
                        return;
                    }
                    var left = (w + xintercept*vmin)/2;
                    ctx.beginPath();
                    ctx.strokeStyle=colour;
                    ctx.moveTo(left, 0);
                    ctx.lineTo(left, h);
                    ctx.stroke();
                    ctx.closePath();
                } else {
                    var d = Math.abs(this.C)/Math.sqrt(this.A * this.A + this.B * this.B);
                    if(d > ratio){
                        return;
                    }
                    if(Math.abs(this.B) > Math.abs(this.A)){ //"flat" line
                        var x0 = -ratio; var x1 = +ratio;
                        var y0 = (this.C - this.A * x0)/this.B; var y1 = (this.C - this.A * x1)/this.B;
                    } else { //"steep" line
                        var y0 = -ratio; var y1 = +ratio;
                        var x0 = (this.C - this.B * y0)/this.A; var x1 = (this.C - this.B * y1)/this.A;
                    }
                    ctx.beginPath();
                    ctx.strokeStyle=colour;
                    ctx.moveTo((w + x0*vmin)/2, (h + y0*vmin)/2);
                    ctx.lineTo((w + x1*vmin)/2, (h + y1*vmin)/2);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
        function Circle(xc, yc, r){
            this.xc = xc || 0;
            this.yc = yc || 0;
            this.r = r || 0;

            this.draw = function(view, ctx, colour){
                var w = ctx.canvas.width; var h = ctx.canvas.height;
                var vmin = Math.min(w,h); var vmax = Math.max(w, h); var ratio = vmax/vmin;
                if(Math.abs(this.xc) > (ratio + this.r) || Math.abs(this.yc) > (ratio + this.r)){
                    return;
                } else{
                    var d = this.r - Math.sqrt(this.xc * this.xc + this.yc * this.yc);
                    if(d > Math.sqrt(1 + ratio*ratio)){
                        return;
                    }
                    var left = (w + this.xc*vmin)/2;
                    var top = (h + this.yc*vmin)/2;
                    var ar = this.r * vmin/2;
                    ctx.beginPath();
                    ctx.strokeStyle=colour;
                    ctx.arc(left,top,ar,0,2*Math.PI);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }

    }

    function AziGridObj(azi){
        azi = azi || 0;
        var t = this;
        if(!(t instanceof AziGridObj)){
            return new AziGridObj(azi);
        }
        GridObj.call(this);
        this.azi = azi;
        this.calculatePlane = function(now, loc, view, ctx){
            var normal = [Math.sin(this.azi * Math.PI/180 + Math.PI),Math.cos(this.azi * Math.PI/180 + Math.PI),0];
            var rotNormal = Quaternion.applyRotation(Argo.view.rot, normal);
            var rotPoint = [0,0,0]; //always passes through centre
            this.setPlane(rotNormal, rotPoint);
        }
    }

    function AltGridObj(alt){
        alt = alt || 0;
        var t = this;
        if(!(t instanceof AltGridObj)){
            return new AltGridObj(alt);
        }
        GridObj.call(this);
        this.alt = alt;
        this.calculatePlane = function(now, loc, view, ctx){
            var normal = [0,0,1];
            var point = [0,0,Math.sin(this.alt * Math.PI/180)];
            var rotNormal = Quaternion.applyRotation(Argo.view.rot, normal);
            var rotPoint = Quaternion.applyRotation(Argo.view.rot, point);
            this.setPlane(rotNormal, rotPoint);
        }
    }

    function RAGridObj(ra){
        ra = ra || 0;
        var t = this;
        if(!(t instanceof RAGridObj)){
            return new RAGridObj(ra);
        }
        GridObj.call(this);
        this.ra = ra;
        this.colour = "blue";
        this.calculatePlane = function(now, loc, view, ctx){
            var rotNormal = Argo.getRotatedCoords(this.ra, 0, now, loc, view);
            var rotPoint = [0,0,0]; //always passes through centre
            this.setPlane(rotNormal, rotPoint);
        }
    }

    function DecGridObj(dec){
        dec = dec || 0;
        var t = this;
        if(!(t instanceof DecGridObj)){
            return new DecGridObj(dec);
        }
        GridObj.call(this);
        this.dec = dec;
        this.colour = "blue";
        this.calculatePlane = function(now, loc, view, ctx){
            var rotNormal = Argo.getRotatedCoords(0, 90, now, loc, view); //find where NCP is
            var s = Math.sin(this.dec * Math.PI/180);
            var rotPoint = [rotNormal[0] * s, rotNormal[1] * s, rotNormal[2] * s]; //scale by sin(dec)
            this.setPlane(rotNormal, rotPoint);
        }
    }


    //Argo properties

    this.stars = [];
    this.messiers = [];
    this.grid = {
        equatorial : [],
        horizontal : []
    };

    this.view = {
        'rot' : new Quaternion(1, 0, 0, 0),
        'zoom' : 1
    };
    this.loc = {
        'lat' : 0, //positive northwards
        'long' : 0 //positive westwards
    };

    this.viewRotSpeed = 15 * Math.PI/180; //rad per second
    this.viewZoomSpeed = 2; //factor per second
    this.viewZoomMin = 0.25;
    this.viewZoomMax = 10;
    this.viewShiftDuration = 1; //second;
    this.viewShiftCountdown = 0;
    
    this.viewSize = {
        w : 1,
        h : 1
    }    
    this.canvas = null;
    this.ctx = null;
    this.keys = {
        active : [],
        shouldHandle : []
    };
    this.menuOpen = false;
    this.mouse = {
        isDown : false,
        store : [],
        Tracker : function(x, y){
            this.pos = {'x' : x, 'y' : y};
            var coords = Argo.getCoordsFromCanvas(x, y);
            this.vec = Argo.getReverseProject(coords.x, coords.y, Argo.view);
        },
        updateStore : function(evt){
            var t = new Argo.mouse.Tracker(evt.clientX, evt.clientY);
            if(Argo.mouse.store.length > 1){
                Argo.mouse.store.shift();
            }
            Argo.mouse.store.push(t);
        },
        dragStart : function(evt){
            if(!Argo.menuOpen){
                Argo.mouse.isDown = true;
                Argo.mouse.updateStore(evt);
                Argo.mouse.current = Argo.mouse.start;
                window.addEventListener("mousemove", Argo.mouse.dragHandler);
            }
        },
        dragHandler : function(evt){
            Argo.mouse.updateStore(evt);
            if(Argo.mouse.store.length > 1){
                var q = Quaternion.fromTwoVectors(Argo.mouse.store[0].vec,Argo.mouse.store[1].vec);
                Argo.view.rot = Argo.view.rot.premultiply(q);
            }
        },
        dragEnd : function(evt){
            Argo.mouse.isDown = false;
            window.removeEventListener("mousemove", Argo.mouse.dragHandler);
            Argo.mouse.store = [];
        },
        
    };
    
    this.settings = {
        'layers' : {
            'stars' : true,
            'messiers' : false,
            'gridequatorial' : false,
            'gridhorizontal' : false
        }
    };
    
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
    function loadGrid(_argo){
        for(var i = -8; i < 9; i++){
            _argo.grid.horizontal.push( new AltGridObj(i*10) );
        }
        for(var j = -18; j < 18; j++){
            _argo.grid.horizontal.push( new AziGridObj(j*10) );
        }

        for(var i = -8; i < 9; i++){
            _argo.grid.equatorial.push( new DecGridObj(i*10) );
        }
        for(var j = 0; j < 24; j++){
            _argo.grid.equatorial.push( new RAGridObj(j*15) );
        }
    }
    
    this.initialise = function(){
        loadData(this, data);
        loadGrid(this);
        this.setLocation(0, 0);
        this.view = {
            'rot' : new Quaternion(1, 0, 0, 0),
            'zoom' : 1
        }
        this.viewSize = {
            w : window.innerWidth,
            h : window.innerHeight
        }
        this.canvas = document.getElementsByTagName("canvas"); //HTMLCollection; access members by id name
        for(var i = 0; i < this.canvas.length; i++){
            this.resizeCanvas(this.canvas[i], this.viewSize.w, this.viewSize.h);
            if(!this.ctx){
                this.ctx = {};
            }
            this.ctx[ this.canvas[i].id ] = this.canvas[i].getContext("2d");
        }
        

        if(!Argo.statusBarInitialised){
            Argo.initialiseStatusBar();
        }

        //event listeners
        
        window.addEventListener("keydown", function(evt){
            var i = Argo.keys.active.indexOf(evt.keyCode);
            if(i < 0){
                Argo.keys.active.push(evt.keyCode);
                Argo.keys.shouldHandle.push(evt.keyCode);
            }
        });
        window.addEventListener("keyup", function(evt){
            var i = Argo.keys.active.indexOf(evt.keyCode);
            if(i >= 0){
                Argo.keys.active.splice(i,1);
            }
            var j = Argo.keys.shouldHandle.indexOf(evt.keyCode);
            if(j >= 0){
                Argo.keys.shouldHandle.splice(i,1);
            }
        });
        window.addEventListener("resize", function(evt){
            windowResize();
        });
        window.addEventListener("wheel", function(evt){
            if(evt.deltaY < 0){
                zoomView(+5);
            } else if (evt.deltaY > 0){
                zoomView(-5);
            }
        });
        window.addEventListener("blur", function(evt){
            Argo.keys.active = [];
            Argo.keys.shouldHandle = [];
            Argo.mouse.dragEnd();
        })
        document.addEventListener("mousedown", Argo.mouse.dragStart);
        document.addEventListener("mouseup", Argo.mouse.dragEnd);

        this.play();
    }
    
    this.play = function(){
        nextFrame();
    }
    this.pause = function(){
        cancelFrame();
    }
    
    function nextFrame(){
        Argo.workerID = window.requestAnimationFrame( function(timestamp){ Argo.timeStep(timestamp); } );
    }
    function cancelFrame(){
        window.cancelAnimationFrame( Argo.workerID );
    }
    
    function windowResize(){
        Argo.viewSize = {
            w : window.innerWidth,
            h : window.innerHeight
        }
        for(var i = 0; i < Argo.canvas.length; i++){
            Argo.resizeCanvas(Argo.canvas[i], Argo.viewSize.w, Argo.viewSize.h);
        }
    }
    
    this.resizeCanvas = function(canvas, width, height){
        canvas.width = width;
        canvas.height = height;
    }

    this.timeStep = function(newTimestamp){
        nextFrame();

        this.timer.step(newTimestamp);
        var now = this.timer.now;
        handleView(this.keys);
        this.draw(now);
        this.updateStatus(now);
    }

    
    function Timer(){
        this.prevTimestamp = null;
        this.timestamp = null;
        this.fps = 30;
        this.fpsAvg = 30;
        this.fpsTracker = [];
        this.deltams = 1000/this.fps;
        this.delta = 1/this.fps;
        this.now = null;
        this.timeSpeed = 1;
        this.step = function(newTimestamp){
            this.prevTimestamp = this.timestamp;
            this.timestamp = newTimestamp;
            
            if(this.prevTimestamp != null){
                this.deltams = this.timestamp - this.prevTimestamp;
                this.delta = this.deltams/1000;
                this.fps = 1000/this.deltams;
                this.fpsTracker.push(this.delta);
                if(this.fpsTracker.length > 60){ this.fpsTracker.shift(); }
                var sum = 0;
                for(var i = 0; i<this.fpsTracker.length; i++){
                    sum += this.fpsTracker[i];
                }
                if(sum > 0){ this.fpsAvg = this.fpsTracker.length / sum; }

                if(this.now != null){
                    var addTime = this.deltams * this.timeSpeed;
                    this.now = new Date( this.now.getTime() + addTime );
                } else {
                    this.now = new Date();
                }
            } else {
                this.now = new Date();
            }

        }
        this.resetTime = function(){
            this.timeSpeed = 1;
            this.now = new Date();
        }
    }
    this.timer = new Timer();

    this.draw = function(now){
        //clear canvases
        for(var c in this.ctx){
            var ctx = this.ctx[c];
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        //handle each layer
        if(this.settings.layers["stars"]){
            for(var i = 0; i < this.stars.length; i++){
                this.stars[i].draw(now, this.loc, this.view, this.ctx["stars"]);
            }
        }
        
        if(this.settings.layers["messiers"]){
            for(var i = 0; i < this.messiers.length; i++){
                this.messiers[i].draw(now, this.loc, this.view, this.ctx["messiers"]);
            }
        }

        if(this.settings.layers["gridequatorial"]){
            for(var i = 0; i < this.grid.equatorial.length; i++){
                this.grid.equatorial[i].draw(now, this.loc, this.view, this.ctx["grid"]);
            }
        }
        if(this.settings.layers["gridhorizontal"]){
            for(var i = 0; i < this.grid.horizontal.length; i++){
                this.grid.horizontal[i].draw(now, this.loc, this.view, this.ctx["grid"]);
            }
        }
    }
    
    function handleView(keys){
        if(Argo.viewShiftCountdown > 0){
            shiftView();
        } else if(!Argo.menuOpen){
            handleViewKeys(keys);
        }
    }
    
    function handleViewKeys(keys){
        var isShiftActive = 0;
        if(keys.active.indexOf(16)>=0){ //shift
            isShiftActive = 1;
        }
        function stopHandling(code){
            var shouldHandleIndex = keys.shouldHandle.indexOf(code);
            if(shouldHandleIndex >= 0){
                keys.shouldHandle.splice(shouldHandleIndex, 1);
            }
        }
        for(var i = 0; i < keys.active.length; i++){
            var code = keys.active[i];
            var shouldHandleIndex = keys.shouldHandle.indexOf(code);
            if(shouldHandleIndex < 0){
                continue;
            }
            var zoom = Math.pow(Argo.viewZoomSpeed, Argo.timer.delta);
            var angle = (Argo.viewRotSpeed * Argo.timer.delta) * (1 + isShiftActive);
            var scaledangle = angle / Argo.view.zoom;
            switch(code){
                case 74: //j
                    Argo.timer.timeSpeed /= 10;
                    stopHandling(code);
                    break;
                case 75: //k
                    Argo.timer.timeSpeed *= 10;
                    stopHandling(code);
                    break;
                case 76: //l
                    Argo.timer.resetTime();
                    stopHandling(code);
                    break;
                case 90: //z
                    zoomView(+1);
                    break;
                case 88: //x
                    zoomView(-1);
                    break;
                case 37: //left
                case 65: //a
                    var q = Quaternion.fromAxisAngle([0,1,0], -scaledangle);
                    Argo.view.rot = Argo.view.rot.premultiply(q);
                    break;
                case 39: //right
                case 68: //d
                    var q = Quaternion.fromAxisAngle([0,1,0], scaledangle);
                    Argo.view.rot = Argo.view.rot.premultiply(q);
                    break;
                case 38: //up
                case 87: //w
                    var q = Quaternion.fromAxisAngle([1,0,0], scaledangle);
                    Argo.view.rot = Argo.view.rot.premultiply(q);
                    break;
                case 40: //down
                case 83: //s
                    var q = Quaternion.fromAxisAngle([1,0,0], -scaledangle);
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

    function zoomView(rate){
        var zoom = Math.pow(Argo.viewZoomSpeed, Argo.timer.delta*rate);
        // if(rate > 0){
        //     Argo.view.zoom = Math.min(Argo.viewZoomMax, Argo.view.zoom * zoom);
        // } else if (rate < 0){
        //     Argo.view.zoom = Math.max(Argo.viewZoomMin, Argo.view.zoom / zoom);
        // }
        Argo.view.zoom = clamp(Argo.view.zoom * zoom, Argo.viewZoomMin, Argo.viewZoomMax)
    }
    
    function startShiftView(startRot, endRot, startZoom, endZoom){
        Argo.view.startRot = startRot;
        Argo.view.endRot = endRot;
        Argo.view.startZoom = startZoom;
        Argo.view.endZoom = endZoom;
        Argo.viewShiftCountdown = Argo.viewShiftDuration;
    }
    function startShiftReset(){
        startShiftView(Argo.view.rot, new Quaternion(1,0,0,0), Argo.view.zoom, 1);
    }
    
    function shiftView(){
        if(Argo.viewShiftCountdown > 0){
            Argo.viewShiftCountdown -= Argo.timer.delta;
            var t = 1 - ( Argo.viewShiftCountdown / Argo.viewShiftDuration );
            t = clamp(t, 0, 1);
            var x = (function smooth(t){
                return t*t*(3 - 2*t);
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
    
    this.statusBarInitialised = false;
    this.statusBarElems = {
        spanTime : null,
        spanLoc : null,
        spanRot : null
    }

    this.initialiseStatusBar = function(){
        var spanTime = document.getElementById("spanTime");
        var spanLoc = document.getElementById("spanLoc");
        var spanRot = document.getElementById("spanRot");
    
        if(!Argo.statusBarElems.spanTime){
            Argo.statusBarElems.spanTime = spanTime;
        }
        if(!Argo.statusBarElems.spanLoc){
            Argo.statusBarElems.spanLoc = spanLoc;
        }
        if(!Argo.statusBarElems.spanRot){
            Argo.statusBarElems.spanRot = spanRot;
        }

        if(spanTime && spanLoc && spanRot){
            this.statusBarInitialised = true;
        }
    }

    //update every second... not as important
    this.updateStatus = function(now){
        if(!this.statusBarInitialised){
            this.initialiseStatusBar();
        }

        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }
        var date = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        var tz = now.getTimezoneOffset();
        var tzh = Math.floor(Math.abs(tz)/60);
        var tzm = Math.abs(tz) % 60;
        var tzs = (tz < 0 ? '+' : '-'); //flipped...
        var timezone = tzs + pad(tzh) + pad(tzm);
        Argo.statusBarElems.spanTime.innerText = date + ' ' + timezone;

        var lattext = Math.abs(this.loc.lat).toFixed(3) + '°' + (this.loc.lat < 0 ? 'S' : 'N');
        var longtext = Math.abs(this.loc.long).toFixed(3) + '°' + (this.loc.long < 0 ? 'E' : 'W');
        Argo.statusBarElems.spanLoc.innerText = lattext + ', ' + longtext;

        var invRot = this.view.rot.conjugate();
        var cov = Quaternion.applyRotation(invRot, [0,0,1]);
        var cl = Math.sqrt(cov[0]*cov[0] + cov[1]*cov[1] + cov[2]*cov[2]);
        var alt = Math.asin(cov[2] / cl) * 180 / Math.PI;
        var azi = ( Math.atan2(-cov[0], -cov[1]) ) * 180 / Math.PI;
        if(cov[0] == 0 && cov[1] == 0){
            azi = 0;
        }
        if(azi < 0){
            azi += 360;
        }
        
        var alttext = "Alt: " + alt.toFixed(2) + '°';
        var azitext = "Azi: " + azi.toFixed(2) + '°';
        var rottext = "Centre of view: " + alttext + ', ' + azitext;
        var zoomtext = "Zoom: " + this.view.zoom.toFixed(2) + "×";

        var f = 1/this.view.zoom;
        var fov = 2 * (2 * Math.atan2(f, 2)) * 180 / Math.PI;
        var fovtext = "FOV: " + fov.toPrecision(3) + '°';
        Argo.statusBarElems.spanRot.innerText = rottext + " " + zoomtext + " " + fovtext + (Argo.viewShiftCountdown > 0 ? " (resetting...)" : "" );

    }

    //geolocation
    
    this.setLocation = function(lat, long){
        lat = clamp(lat, -90, 90);
        long = clamp(long, -180, 180);
        this.loc = {
            'lat' : lat, //positive northwards
            'long' : long //positive westwards
        };
        return this.loc;
    }

    //misc math

    function clamp(x, min, max){
        if(min > max){
            var m = min;
            min = max;
            max = m;
        }
        return Math.min(max, Math.max(min, x));
    }
    
    //date and time methods

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

    //projection and coordinate methods

    this.getHorizontalCoords = function(ra, dec, now, loc){
        var lst = localMST(now, loc.lat, loc.long); //in hours
        var H = (lst*15 - ra)* Math.PI/180; //deg to radians
        var q = loc.lat* Math.PI/180; //deg to radians
        var d = dec * Math.PI/180; //deg to radians
        var alt = Math.asin(Math.sin(q)*Math.sin(d) + Math.cos(q)*Math.cos(d)*Math.cos(H)); //currently in radians
        var azi = Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(q) - Math.tan(d)*Math.cos(q)); //currently in radians
        
        var x = - Math.cos(alt)*Math.sin(azi);
        var y = - Math.cos(alt)*Math.cos(azi);
        var z = Math.sin(alt);
        return [x, y, z];
    }
    
    this.getRotatedCoords = function(ra, dec, now, loc, view){
        var pos = this.getHorizontalCoords(ra, dec, now, loc);
        var newpos = Quaternion.applyRotation(view.rot, pos);
        
        return newpos;
    }

    this.projectLocation = function(newpos, view){
        var xx = - 2*newpos[0] /(1+newpos[2]) * view.zoom; //flipped left-right since we are looking inside the sphere
        var yy = - 2*newpos[1] /(1+newpos[2]) * view.zoom; //flipped because canvas
        return {'x': xx, 'y': yy};
    }
    this.getProjectedLocation = function(ra, dec, now, loc, view){
        var newpos = this.getRotatedCoords(ra, dec, now, loc, view);
        
        return this.projectLocation(newpos, view);
    }
    
    this.getProjectedCircle = function(ra, dec, radius, now, loc, view){
        var newpos = this.getRotatedCoords(ra, dec, now, loc, view);
        var rawRadius = radius * Math.PI/180;
                
        var xx = - 2*newpos[0] /( Math.cos(rawRadius) +newpos[2]) * view.zoom; //flipped left-right since we are looking inside the sphere
        var yy = - 2*newpos[1] /( Math.cos(rawRadius) +newpos[2]) * view.zoom; //flipped because canvas
        
        var angularRadius = Math.abs(2*Math.sin(rawRadius)/(Math.cos(rawRadius) + newpos[2]) * view.zoom);
        return {'x': xx, 'y': yy, 'ar': angularRadius};
    }
    this.getCanvasLocation = function(x, y){
        var w = Argo.viewSize.w;
        var h = Argo.viewSize.h;
        var vmin = Math.min(w,h);
        //var vmax = Math.max(w,h);
        //var ratio = vmax/vmin;
        var left = (w + x*vmin)/2;
        var top = (h + y*vmin)/2;
        return {'left' : left, 'top' : top};
    }
    this.getCoordsFromCanvas = function(left, top){
        var w = Argo.viewSize.w;
        var h = Argo.viewSize.h;
        var vmin = Math.min(w,h);
        //var vmax = Math.max(w,h);
        //var ratio = vmax/vmin;
        var x = (2 * left - w)/vmin;
        var y = (2 * top - h)/vmin;
        return {'x' : x, 'y' : y};
    }
    this.getReverseProject = function(xp, yp, view){
        xx = (-xp)/(view.zoom);
        yy = (-yp)/(view.zoom);
        var x = (4 * xx)/(4 + xx*xx + yy*yy);
        var y = (4 * yy)/(4 + xx*xx + yy*yy);
        var z = (4 - xx*xx - yy*yy)/(4 + xx*xx + yy*yy);
        return [x,y,z];
    }

}();

window.addEventListener("load", function(evt){
    Argo.initialise();
});