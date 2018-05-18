window.addEventListener("load", function(e){

	var openMenu = document.getElementById("openMenu");
	var closeMenu = document.getElementById("closeMenu");
	var menuLayer = document.getElementById("menuLayer");

	function openfn(evt){
		Argo.menuOpen = true;
		menuLayer.style.display = "block";
		//openMenu.style.display = "none";
		openMenu.style.backgroundColor = "rgba(127,127,127,0.5)";
	}

	function closefn(evt){
		Argo.menuOpen = false;
		menuLayer.style.display = null;
		//openMenu.style.display = null;
		openMenu.style.backgroundColor = null;
	}

	function togglefn(evt){
		if(Argo.menuOpen){
			closefn(evt);
		} else {
			openfn(evt);
		}
	}

	openMenu.addEventListener("click", togglefn);
	closeMenu.addEventListener("click", closefn);

	var btnGeolocate = document.getElementById("btnGeolocate");
	btnGeolocate.addEventListener("click", geolocate);

	var inputlat = document.getElementById("inputlat");
	var inputlong = document.getElementById("inputlong");
	var inputnorth = document.getElementById("inputnorth");
	var inputsouth = document.getElementById("inputsouth");
	var inputwest = document.getElementById("inputwest");
	var inputeast = document.getElementById("inputeast");

	function geolocate(){
        if ("geolocation" in navigator) {
            var geo_options = {
              timeout: 2000,
              maximumAge: 0
            };
            navigator.geolocation.getCurrentPosition(gotLocation,locationError,geo_options);
        } else {
            
        }
    }

    function gotLocation(pos){
		var lat = pos.coords.latitude;
		var long = -pos.coords.longitude; //our convention is positive westwards
		
		updateLocation(lat, long);
    }

    function locationError(err){
        updateLocation(0, 0);
	}

	function updateLocation(lat, long){
		var result = Argo.setLocation(lat, long); 

		lat = result.lat;
		long = result.long;


		inputlat.value = Math.abs(lat);
		inputlong.value = Math.abs(long);

		function setChecked(elem, state){
			if (state != elem.checked) {
				elem.click();
			}
		}

		if(lat < 0){
			setChecked(inputsouth, true);
			setChecked(inputnorth, false);
		} else {
			setChecked(inputnorth, true);
			setChecked(inputsouth, false);
		}

		if(long < 0){
			setChecked(inputeast, true);
			setChecked(inputwest, false);
		} else {
			setChecked(inputwest, true);
			setChecked(inputeast, false);
		}

	}

	var btnSetLocation = document.getElementById("btnSetLocation");
	btnSetLocation.addEventListener("click", setLocation);

	function setLocation(){
		var lat = Number(inputlat.value);
		var long = Number(inputlong.value);

		if(inputsouth.checked){
			lat *= -1;
		}
		if(inputeast.checked){
			long *= -1;
		}

		updateLocation(lat, long);
		
	}
	
});