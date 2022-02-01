var recording = 0;
var file_name = {};
var azimuth = {};
var elevation = {};
var color = {};
var user_num_source;
var actual_num_source;

const colors = [0x009dff, 0xff7f0e, 0x00ff00, 0xff0000, 0x9467bd, 0xd3d3d3, 0xc39b77, 0xe377c2, 0xbcbd22, 0x00ffff];
const css_colors = ["#009dff", "#ff7f0e", "#00ff00", "#ff0000", "#9467bd", "#d3d3d3", "#c39b77", "#e377c2", "#bcbd22", "#00ffff"];
var request = new XMLHttpRequest(); 

function confirm_annotation(){
	request.open('POST', '/confirm_annotation');
	request.onreadystatechange = function() {
		if (request.readyState == 4){

			document.getElementById("user_note").value = localStorage.getItem("user_note");
			color = JSON.parse(request.response)["color"];
			azimuth = JSON.parse(request.response)["azimuth"];
			elevation = JSON.parse(request.response)["elevation"];

			user_num_source = parseInt(JSON.parse(request.response)["user_num_source"]["0"]);
			actual_num_source = parseInt(JSON.parse(request.response)["actual_num_source"]["0"]);

			// load full audio file
			recording = JSON.parse(request.response)["recording"]["0"];
			document.getElementById('original-audio-source').src = '/templates/interface/assets/audio/recording/'+recording;
			document.getElementById('audio-full').load();

			for (const [key,value] of Object.entries( JSON.parse(request.response)["file_name"] )) {
				let new_td = document.createElement('td');

				let new_audio = document.createElement('audio');
				new_audio.id = "audio-"+key;
				new_audio.controls = true;
				new_audio.style.display = "none";

				let new_audio_source = document.createElement('source');
				new_audio_source.id = "audio-source-"+key;
				new_audio_source.type = "audio/wav";
				new_audio_source.src = '/templates/interface/assets/audio/source/'+value;
				new_audio.appendChild(new_audio_source);

				let new_button = document.createElement('button');
				new_button.id = "audio-frame-"+key;
				new_button.className = "audio-frame";

				// styling of buttons
				new_button.style.background = "linear-gradient(to right, #efefef 0%, #ffffff 0%)";
				new_button.style.width = "60px";
				new_button.style.cursor = "pointer";
				new_button.style.border = "1px black solid";
				new_button.innerHTML = "Play Audio";
				// end of styling

				new_td.appendChild(new_audio);
				new_td.appendChild(new_button);

				document.getElementById("class-name").appendChild(new_td);
			}

			for (const [key,value] of Object.entries(color)) {

				addLocation([azimuth[key], elevation[key], value]);

				let new_tr =  document.createElement('tr');
				let new_td_color = document.createElement('td');
				let new_div = document.createElement('div');
				new_div.className = 'confirm-indicator';
				new_div.style.backgroundColor = css_colors[parseInt(value)-1];
				new_div.innerHTML = value;
				new_td_color.appendChild(new_div);
				new_tr.appendChild(new_td_color);
				for (let i = 0; i < actual_num_source; i++){
					let new_td = document.createElement('td');
					let new_checkbox = document.createElement('input');
					new_checkbox.id = 'checkbox-'+key+'-'+i;
					new_checkbox.className = 'checkbox-'+key;
					new_checkbox.type = 'checkbox';
					new_td.appendChild(new_checkbox);
					new_tr.appendChild(new_td);
				}
				document.getElementById('matching-table').appendChild(new_tr);
			}
		}
	}
	request.send();
}

document.addEventListener('click', function(e){
	if (e.target.id.substring(0,11) == "audio-frame") {
		var audios = document.getElementsByClassName('audio-frame');

		playing_id = ''

		for(let i = 0; i < audios.length; i++) {
			audio_id = ''

			if (audios[i].id == "audio-frame") audio_id = "audio-frame-full"
			else audio_id = "audio-" + audios[i].id.replace("audio-frame-","");

			if (audios[i].id != e.target.id) {
				document.getElementById(audio_id).pause();
				document.getElementById(audios[i].id ).innerHTML = 'Play Audio';
			}
			else {
				playing_id = audio_id;
				document.getElementById(audios[i].id).innerHTML = document.getElementById(audios[i].id).innerHTML == 'Play Audio' ? 'Pause Audio' : 'Play Audio';
				document.getElementById(audios[i].id).innerHTML == 'Play Audio' ? document.getElementById(audio_id).pause() : document.getElementById(audio_id).play();
			}
		}

		document.getElementById(playing_id).addEventListener("timeupdate",function(){
			if (playing_id.replace('audio-','') == e.target.id.replace('audio-frame-','')) {
				let track = document.getElementById(playing_id).currentTime / document.getElementById(playing_id).duration * 100;
				document.getElementById(e.target.id).style.background = 'linear-gradient(to right, #efefef '+ track +'%, #ffffff 0%)';
			}
		});

		document.getElementById(playing_id).addEventListener("ended",function(){
			document.getElementById(e.target.id).innerHTML = 'Play Audio';
		});
	}
	else if (e.target.id.substring(0,8) =="checkbox"){
		tail = e.target.id.substring(e.target.id.length-1, e.target.id.length);
		for (let i = 0; i < user_num_source; i++) {
			id_name = "checkbox-"+i+"-"+tail;

			if ( e.target.id != id_name && document.getElementById(id_name).checked ) {
				window.alert("You are only allowed to match one source with one annotation");
				e.preventDefault();
				return;
			}
		}

		let checkboxes = document.getElementsByClassName(e.target.className);

		for (let i = 0; i < checkboxes.length; i++) {
			if ( checkboxes[i].id != e.target.id && document.getElementById(checkboxes[i].id).checked ) document.getElementById(checkboxes[i].id).checked = false;
		}
	}
});

function addLocation(coordinates) {
	let item_index = coordinates[2];

	// Azimuth Annotation Display
	document.getElementById('head-item-'+item_index).style.display = '';
	document.getElementById('circular'+item_index).style.display = '';
	document.getElementById('circular'+item_index).style.transform = 'rotate('+coordinates[0]+'deg)';

	coordinates[0] = parseInt(coordinates[0]);
	coordinates[1] = parseInt(coordinates[1]);

	// Elevation Annotation Display
	if (coordinates[0] > 337.5 || coordinates[0] < 22.5){
		document.getElementById('side-item-'+item_index).style.display = '';
		document.getElementById('circularS'+item_index).style.display = '';
		let e = 90 + -1 * coordinates[1];
		document.getElementById('circularS'+item_index).style.transform = 'rotate('+e+'deg)';

	}
	else if (coordinates[0] >= 22.5 && coordinates[0] <= 67.5){
		document.getElementById('front-item-'+item_index).style.display = '';
		document.getElementById('circularF'+item_index).style.display = '';
		document.getElementById('side-item-'+item_index).style.display = '';
		document.getElementById('circularS'+item_index).style.display = '';
		let e = 90 + -1 * coordinates[1];
		document.getElementById('circularF'+item_index).style.transform = 'rotate('+e+'deg)';
		document.getElementById('circularS'+item_index).style.transform = 'rotate('+e+'deg)';

	}
	else if (coordinates[0] > 67.5 && coordinates[0] < 112.5){
		document.getElementById('front-item-'+item_index).style.display = '';
		document.getElementById('circularF'+item_index).style.display = '';
		let e = 90 + -1 * coordinates[1];
		document.getElementById('circularF'+item_index).style.transform = 'rotate('+e+'deg)';

	}
	else if (coordinates[0] >= 112.5 && coordinates[0] <= 157.5){
		document.getElementById('front-item-'+item_index).style.display = '';
		document.getElementById('circularF'+item_index).style.display = '';
		document.getElementById('side-item-'+item_index).style.display = '';
		document.getElementById('circularS'+item_index).style.display = '';
		let e1 = 90 + -1 * coordinates[1];
		let e2 = coordinates[1] + 270;
		document.getElementById('circularF'+item_index).style.transform = 'rotate('+e1+'deg)';
		document.getElementById('circularS'+item_index).style.transform = 'rotate('+e2+'deg)';

	}
	else if (coordinates[0] > 157.5 && coordinates[0] < 202.5){
		document.getElementById('side-item-'+item_index).style.display = '';
		document.getElementById('circularS'+item_index).style.display = '';
		let e = coordinates[1] + 270;
		document.getElementById('circularS'+item_index).style.transform = 'rotate('+e+'deg)';

	}
	else if (coordinates[0] >= 202.5 && coordinates[0] <= 247.5){
		document.getElementById('front-item-'+item_index).style.display = '';
		document.getElementById('circularF'+item_index).style.display = '';
		document.getElementById('side-item-'+item_index).style.display = '';
		document.getElementById('circularS'+item_index).style.display = '';
		let e = coordinates[1] + 270;
		document.getElementById('circularF'+item_index).style.transform = 'rotate('+e+'deg)';
		document.getElementById('circularS'+item_index).style.transform = 'rotate('+e+'deg)';

	}
	else if (coordinates[0] > 247.5 && coordinates[0] < 292.5){
		document.getElementById('front-item-'+item_index).style.display = '';
		document.getElementById('circularF'+item_index).style.display = '';
		let e = coordinates[1] + 270;
		document.getElementById('circularF'+item_index).style.transform = 'rotate('+e+'deg)';
	}
	else {
		document.getElementById('front-item-'+item_index).style.display = '';
		document.getElementById('circularF'+item_index).style.display = '';
		document.getElementById('side-item-'+item_index).style.display = '';
		document.getElementById('circularS'+item_index).style.display = '';
		let e1 = 90 + -1 * coordinates[1];
		let e2 = coordinates[1] + 270;
		document.getElementById('circularF'+item_index).style.transform = 'rotate('+e2+'deg)';
		document.getElementById('circularS'+item_index).style.transform = 'rotate('+e1+'deg)';

	}
	displayBall(coordinates[0]-180, coordinates[1], item_index);
}

function submit_confirmation(){
	let num_checked = 0;
	let found_column_index = document.getElementsByTagName("input")[0].id.substring(8,9);
	let total_found_column_index = 1;

	for (let i = 0; i < document.getElementsByTagName("input").length; i++){
		if (document.getElementsByTagName("input")[i].checked) {
			num_checked += 1;
			if (document.getElementsByTagName("input")[i].id.substring(8,9) != found_column_index){
				found_column_index = document.getElementsByTagName("input")[i].id.substring(8,9);
				total_found_column_index += 1;
			}
		}
	}

	if (user_num_source > num_checked){
		window.alert("You must match all of the Annotation points with their corresponding Sound Sources")
		event.preventDefault();
		return;
	}

	if (user_num_source >= actual_num_source && total_found_column_index < actual_num_source) { 
		// This restriction only applies for overestimation and normal circumstance
		window.alert("You must match all of the Sound Sources with their corresponding Annotation points")
		event.preventDefault();
		return;
	}

	let recording_id = parseInt(recording.replace('.wav','')) + 1;
	let location_id = '';
	let source_id = ''

	for (const [key,value] of Object.entries( JSON.parse(request.response)["location_id"])) {
		location_id += value + ',';
	}
	for (const [key,value] of Object.entries( JSON.parse(request.response)["source_id"] )) {
		source_id += value + ',';
	}

	location_id = location_id.substring(0,location_id.length-1);
	source_id = source_id.substring(0,source_id.length-1);

	request.open('POST', '/submit_confirmation', true);
	request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
	var data = JSON.stringify({recording_id, location_id, source_id});
	request.send(data);

	window.location = '/templates/interface/submit.html';
}


/* Three.js */

container = document.getElementById('3d-head');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
var light = new THREE.HemisphereLight(0xffffff, 0.8);
scene.add(light);

// front light
var pointLight = new THREE.PointLight(0xffffff, 0.8, 0);
pointLight.position.set(30, 30, 250);
scene.add(pointLight);

// back light
var pointLight2 = new THREE.PointLight(0xffffff, 0.8, 0);
pointLight2.position.set(30, 30, -250);
scene.add(pointLight2);

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.z = 30;

var sphereGeometry = new THREE.SphereGeometry(8,60,30);
var sphereMaterial = new THREE.MeshLambertMaterial({
	map: new THREE.TextureLoader().load('/templates/interface/img/face.png'),
	color: 0xefd8c3
});
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0,0,0);

var ear1Geometry = new THREE.TorusGeometry(1,1.2,30,100);
var ear1Material = new THREE.MeshLambertMaterial({
	color: 0xc2a68b
});
var ear1 = new THREE.Mesh(ear1Geometry, ear1Material);
ear1.position.set(7.8,0,0);

var ear2Geometry = new THREE.TorusGeometry(1,1.2,30,100);
var ear2Material = new THREE.MeshLambertMaterial({
	color: 0xc2a68b
});
var ear2 = new THREE.Mesh(ear2Geometry, ear2Material);
ear2.position.set(-7.8,0,0);

var noseGeometry = new THREE.TorusGeometry(0.3,0.8,30,100);
var noseMaterial = new THREE.MeshLambertMaterial({
	color: 0xc2a68b
});
var nose = new THREE.Mesh(noseGeometry, noseMaterial);
nose.position.set(0,0,7.4);
nose.rotation.y = 90;

var frameGeometry = new THREE.SphereBufferGeometry(15,20,20);
var frameMaterial = new THREE.MeshLambertMaterial({});
var frame = new THREE.Mesh(frameGeometry, frameMaterial);
var edgesGeometry = new THREE.EdgesGeometry(frameGeometry);
var wireframe = new THREE.LineSegments(edgesGeometry, new THREE.LineBasicMaterial({color: 0x0000ff})); 

var ballGeometry;
var ballMaterial;

function toRadian(angle){
	return angle * Math.PI / 180;
}

function polarToCartesian(lon, lat, radius) {
	var phi = ( 90 - lat ) * Math.PI / 180
	var theta = ( lon + 180 ) * Math.PI / 180
	return {
	  x: -(radius * Math.sin(phi) * Math.sin(theta)),
	  y: radius * Math.cos(phi),
	  z: radius * Math.sin(phi) * Math.cos(theta),
	}
}

function displayBall(azimuth, elevation, number){
	var returnlist = polarToCartesian(azimuth, elevation, 15);
	ballGeometry = new THREE.SphereGeometry(0.8,60,30);
	ballMaterial = new THREE.MeshLambertMaterial({
		map: new THREE.TextureLoader().load('/templates/interface/img/item-'+number+'.jpg')
	});
	var ball = new THREE.Mesh(ballGeometry, ballMaterial);
	ball.name = 'ball'+number;
	ball.position.set(returnlist['x'], returnlist['y'], returnlist['z']);
	scene.remove(scene.getObjectByName('ball'+number));
	scene.add(ball);

	return ball;
}

scene.add(wireframe);
scene.add(sphere);
scene.add(ear1);
scene.add(ear2);
scene.add(nose);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(500,500);
container.appendChild(renderer.domElement);

camera.lookAt(sphere.position);

controls = new THREE.OrbitControls(camera,renderer.domElement);
controls.minDistance = 1;
controls.maxDistance = 500;

function animate(){
	requestAnimationFrame(animate);
	// create rotation to all 3D annotations
	for (let i=0 ; i<10; i++){
		if (scene.getObjectByName('ball'+(i + 1)) != null) scene.getObjectByName('ball'+(i + 1)).rotation.y += 0.05;
	}
	controls.update();
	renderer.render(scene,camera); 
}
animate();