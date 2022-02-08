// request to server
var request = new XMLHttpRequest();
var survey_id = '';

var recordings = [];
var group_id = 0;
var recordings_practice = [];
var group_id_practice = 0;

var curr_recording = 0;
var curr_practice_recording = 0;
var totalAudios = 0;
var totalPracticeAudios = 0;
var practice = 0;

if (localStorage.getItem('practice') == undefined){
	practice = 1; // practice = true
	curr_practice_recording = 0;
}

ajax_start();
function ajax_start(){
	var request_start = new XMLHttpRequest();
	request_start.open('POST', '/annotation_interface');
	request_start.onreadystatechange = function() {
		if (request_start.readyState == 4){
			console.log(request_start.response);

			survey_id = JSON.parse(request_start.response)["survey_id"]["0"];
			localStorage.setItem("survey_id", survey_id);

			group_id = JSON.parse(request_start.response)["group_id"]["0"];
			for (const [key,value] of Object.entries( JSON.parse(request_start.response)["recordings"] )) {
				recordings.push(value);
				recordings.push(value);
				recordings.push(value);
				recordings.push(value);
			}
			recordings = shuffle(recordings);

			group_id_practice = JSON.parse(request_start.response)["group_id_practice"]["0"];
			for (const [key,value] of Object.entries( JSON.parse(request_start.response)["recordings_practice"] )) {
				recordings_practice.push(value);
			}

			totalAudios = recordings.length - 1;
			totalPracticeAudios = recordings_practice.length - 1;

			if (!practice) document.getElementById('source').src = '/templates/interface/assets/audio/'+ 'group_' + group_id.toString() + '/' + recordings[curr_recording] + '.wav';
			else document.getElementById('source').src = '/templates/interface/assets/audio/'+ 'group_' + group_id_practice.toString() + '/' + recordings_practice[curr_practice_recording] + '.wav';
			document.getElementById('audio').load();
		}
	}
	request_start.setRequestHeader('content-type', 'application/json;charset=UTF-8');
	var data = JSON.stringify({practice});
	request_start.send(data);
}

/* Fisher-Yates Shuffle */
function shuffle(array) {
	let currentIndex = array.length, randomIndex;
	while (currentIndex != 0) {
	  randomIndex = Math.floor(Math.random() * currentIndex);
	  currentIndex--;
	  [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

// check if the user goes through the whole instruction
var read_all_rules = false;

// color of the displayed annotation dot
const color = 0x009dff;

// prevent deletion and mousemove happen at the same time
var suppress = false;

// prevent moving and clicking happening at the same time
var not_moving = true;

// Location
var curr_azimuth = undefined;
var curr_elevation = undefined;

// Interaction
var action_type = undefined;
var value = undefined;
var timestamp = undefined;

// this is used to distinguish between adding event and determining event
var key_perform = false;

// user control of audio
var isPlaying = false;

// modal box
var modal = document.getElementById("modal");

// instruction number
var curr_instruction = 1;

// keep track of the entered annotation part
var azimuth_item_index = 0;
var elevation_item_index = 0;

document.getElementById('body').addEventListener("mouseup",function(){ 
	delete_annotation = false;
	document.getElementById('body').style.cursor = 'default';
});

document.getElementById('key-message').addEventListener("click",popKeyRules);
document.getElementById('message').addEventListener("click",popRules);
document.getElementById('instruction-left').addEventListener("click",move_instruction_last);
document.getElementById('instruction-right').addEventListener("click",move_instruction_next);
document.getElementById('instruction-proceed').addEventListener("click",closeRules);
document.getElementById('sign').addEventListener("click",closeRules);
document.getElementById('audio-frame').addEventListener("click",addPlaying);
document.getElementById('audio').addEventListener("ended",display2D);
document.getElementById('audio').addEventListener("timeupdate",audioTracker);
document.getElementById('azimuth-plus').addEventListener("click",move_azimuth_plus);
document.getElementById('elevation-plus').addEventListener("click",move_elevation_plus);
document.getElementById('azimuth-minus').addEventListener("click",move_azimuth_minus);
document.getElementById('elevation-minus').addEventListener("click",move_elevation_minus);

function popKeyRules(e){
	e.preventDefault();
	window.alert("Press [Option] or [Alt] key to add an annotation once you see the cursor turning to ‘+’. Press [Command] or [Win] key to delete an annotation once you see the cursor turning to ‘-’. Deleting an annotation means to delete both its annotated horizontal location and vertical location. You must annotate on the blue circle.")
}

function popRules(e){ 
	e.preventDefault();
	modal.style.display = "block";
	if (read_all_rules) {
		document.getElementById('sign').style.visibility = '';
	}
	document.getElementById('instruction-proceed').style.display = 'none'; // CLICK TO START
	document.getElementById('instruction-right').style.display = '';
	document.getElementById('instruction'+curr_instruction).style.display = 'none';
	document.getElementById('instruction1').style.display = '';
	curr_instruction = 1;
}

function closeRules(e){ 
	e.preventDefault();
	modal.style.display = "none";
}

function move_instruction_next(e){
	e.preventDefault();
	if (curr_instruction < 5) {
		document.getElementById('instruction'+curr_instruction).style.display = 'none';
		document.getElementById('instruction'+(curr_instruction+1)).style.display = '';
		curr_instruction += 1;
	}
	if (curr_instruction == 5) {
		document.getElementById("instruction-right").style.display = 'none';
		document.getElementById("instruction-proceed").style.display = '';
		read_all_rules = true;
	}
}

function move_instruction_last(e){
	e.preventDefault();
	if (curr_instruction > 1) {
		document.getElementById("instruction-right").style.display = '';
		document.getElementById("instruction-proceed").style.display = 'none';
		document.getElementById('instruction'+curr_instruction).style.display = 'none';
		document.getElementById('instruction'+(curr_instruction-1)).style.display = '';
		curr_instruction -= 1;
	}
}

function audioTracker(){
	let track = document.getElementById('audio').currentTime / document.getElementById('audio').duration * 100;
	document.getElementById('audio-frame').style.background = 'linear-gradient(to right, #efefef '+track+'%, #ffffff 0%)';
}

function addPlaying(e){
	e.preventDefault();
	if (!isPlaying){
		document.getElementById('audio').play();
		document.getElementById('audio-frame').innerHTML='Pause Audio';
		isPlaying = true;

		value = null;
		timestamp = Date.now();
		action_type = "play audio";
		ajax_interaction();
	}
	else{
		isPlaying = false
		document.getElementById('audio').pause();
		document.getElementById('audio-frame').innerHTML='Play Audio';
	}
}

function display2D(){ 
	isPlaying = false;
	document.getElementById('audio-frame').innerHTML='Play Audio';
	document.getElementById('feedback').style.visibility = '';
	document.getElementById('feedback').style.display = 'inline-block';
	document.getElementById('head-wrapper').style.display = 'inline-block';
	document.getElementById('front-wrapper').style.display = 'inline-block';
	document.getElementById('side-wrapper').style.display = 'inline-block';
	displayButton();
}

function displayButton(){
	if (!practice){
		if (curr_recording < totalAudios) {
			document.getElementById('btn-button-next').value = "NEXT";
			document.getElementById('btn-button-next').style.display = '';
		}
		else {
			document.getElementById('btn-button-next').style.display = 'none';
			document.getElementById('btn-button-submit').style.display = '';
		}
	}
	else{
		if (curr_practice_recording < totalPracticeAudios) {
			document.getElementById('btn-button-next').value = "NEXT";
			document.getElementById('btn-button-next').style.display = '';
		}
		else{
			document.getElementById('btn-button-next').value = "GO TO TASK";
			document.getElementById('btn-button-next').style.display = '';
			document.getElementById('btn-button-again').style.display = '';
		}
	}
}

function askProceed(){
	if (azimuth_item_index != 1 || elevation_item_index != 1 ) {
		window.alert("You must annotate one spatial location"); 
		return false;
	}
	return true;
}

function ajax_interaction() {
	request.open('POST', '/interaction', true);
	request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
	var data = JSON.stringify({action_type,value,timestamp,survey_id,practice});
	request.send(data);
}

function ajax_next(again, end){
	if (!askProceed()){
		event.preventDefault();
		return false;
	}

	let user_note = document.getElementById("user_note").value;
	localStorage.setItem("user_note", user_note);
	timestamp = Date.now();
	request.open('POST', '/next', true);
	request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
    let file_name = practice ? recordings[curr_practice_recording] : recordings[curr_recording];

	var data = JSON.stringify({survey_id,file_name,curr_azimuth,curr_elevation,timestamp,user_note,practice,end,group_id});
	request.send(data);

	if (again){
		curr_practice_recording = 0;
		practice = 1;
		document.getElementById('source').src = '/templates/interface/assets/audio/'+ 'group_' + group_id_practice.toString() + '/' + recordings_practice[curr_practice_recording] + '.wav';
		document.getElementById('audio').load();
	}
	else{
		if (practice){
			curr_practice_recording += 1;
			if (curr_practice_recording > totalPracticeAudios) {
				document.getElementById('title').style.display = 'none';
				practice = 0;
				curr_recording = 0;
				document.getElementById('source').src = '/templates/interface/assets/audio/'+ 'group_' + group_id.toString() + '/' + recordings[curr_recording] + '.wav';
				document.getElementById('audio').load();
			}
			else{
				document.getElementById('source').src = '/templates/interface/assets/audio/'+ 'group_' + group_id_practice.toString() + '/' + recordings_practice[curr_practice_recording] + '.wav';
				document.getElementById('audio').load();
			}
		}
		else{ // non-practice
			curr_recording += 1;
			if (curr_recording > totalAudios) {
				window.location = '/templates/interface/submit.html';
				return;
			}
			document.getElementById('source').src = '/templates/interface/assets/audio/'+ 'group_' + group_id.toString() + '/' + recordings[curr_recording] + '.wav';
			document.getElementById('audio').load();
		}
	}

	reloadAll();
	document.getElementById('head-wrapper').style.display = 'none';
	document.getElementById('front-wrapper').style.display = 'none';
	document.getElementById('side-wrapper').style.display = 'none';
	document.getElementById('feedback').style.visibility = 'hidden';
	document.getElementById('btn-button-next').style.display = 'none';
	document.getElementById('btn-button-again').style.display = 'none';
	document.getElementById('audio-frame').style.background = 'linear-gradient(to right, #efefef 0%, #ffffff 0%)';
}

function displayBoth(hasFront, index, temp_azimuth, degree){
	if (hasFront){
		if (temp_azimuth < 22.5 || temp_azimuth > 337.5){ 
			document.getElementById('front-item-'+index).style.display = 'none';
			document.getElementById('circularF'+index).style.display = 'none';

			document.getElementById('side-item-'+index).style.display = '';
			document.getElementById('circularS'+index).style.display = '';
			document.getElementById('circularS'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else if (temp_azimuth > 67.5 && temp_azimuth < 112.5){
			document.getElementById('side-item-'+index).style.display = 'none';
			document.getElementById('circularS'+index).style.display = 'none';
			document.getElementById('circularF'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else if (temp_azimuth > 157.5 && temp_azimuth < 202.5){ 
			document.getElementById('front-item-'+index).style.display = 'none';
			document.getElementById('circularF'+index).style.display = 'none';

			document.getElementById('side-item-'+index).style.display = '';
			document.getElementById('circularS'+index).style.display = '';
			document.getElementById('circularS'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else if (temp_azimuth > 247.5 && temp_azimuth < 292.5){
			document.getElementById('side-item-'+index).style.display = 'none';
			document.getElementById('circularS'+index).style.display = 'none';
			document.getElementById('circularF'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else{
			document.getElementById('side-item-'+index).style.display = '';
			document.getElementById('circularS'+index).style.display = '';
			if (temp_azimuth > 270 || temp_azimuth < 90){
				if (degree > 180) { document.getElementById('circularS'+index).style.transform = 'rotate('+(360-degree)+'deg)'; }
				else { document.getElementById('circularS'+index).style.transform = 'rotate('+degree+'deg)'; }
			}
			else if (temp_azimuth < 270 && temp_azimuth > 90){
				if (degree < 180) { document.getElementById('circularS'+index).style.transform = 'rotate('+(360-degree)+'deg)'; }
				else { document.getElementById('circularS'+index).style.transform = 'rotate('+degree+'deg)'; }
			}
		}
	}
	if (!hasFront){
		if (temp_azimuth < 22.5 || temp_azimuth > 337.5){ 
			document.getElementById('front-item-'+index).style.display = 'none';
			document.getElementById('circularF'+index).style.display = 'none';
			document.getElementById('circularS'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else if (temp_azimuth > 67.5 && temp_azimuth < 112.5){
			document.getElementById('side-item-'+index).style.display = 'none';
			document.getElementById('circularS'+index).style.display = 'none';

			document.getElementById('front-item-'+index).style.display = '';
			document.getElementById('circularF'+index).style.display = '';
			document.getElementById('circularF'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else if (temp_azimuth > 157.5 && temp_azimuth < 202.5){ 
			document.getElementById('front-item-'+index).style.display = 'none';
			document.getElementById('circularF'+index).style.display = 'none';
			document.getElementById('circularS'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else if (temp_azimuth > 247.5 && temp_azimuth < 292.5){
			document.getElementById('side-item-'+index).style.display = 'none';
			document.getElementById('circularS'+index).style.display = 'none';

			document.getElementById('front-item-'+index).style.display = '';
			document.getElementById('circularF'+index).style.display = '';
			document.getElementById('circularF'+index).style.transform = 'rotate('+degree+'deg)';
		}
		else{
			document.getElementById('front-item-'+index).style.display = '';
			document.getElementById('circularF'+index).style.display = '';
			if (temp_azimuth < 180){
				if (degree > 180){ document.getElementById('circularF'+index).style.transform = 'rotate('+(360-degree)+'deg)'; }
				else{ document.getElementById('circularF'+index).style.transform = 'rotate('+degree+'deg)';  }
			}
			else if (temp_azimuth > 180){
				if (degree < 180){ document.getElementById('circularF'+index).style.transform = 'rotate('+(360-degree)+'deg)';  }
				else{ document.getElementById('circularF'+index).style.transform = 'rotate('+degree+'deg)'; }
			}
		}
	}
}

function move_azimuth_plus(e){
	e.preventDefault();

	if (document.getElementById('head-item-1').style.display == 'none'){
		window.alert("Please annotate or click to select an annotation first using the 2D views"); 
		return false; 
	}

	temp_azimuth = parseInt(document.getElementById('p-azimuth').innerHTML) + 1;
	temp_azimuth = (temp_azimuth == 360 ? temp_azimuth = 0 : temp_azimuth);

	if (document.getElementById('front-item-1').style.display != 'none'){
		degree = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));

		if ((temp_azimuth < 180 && degree > 180) || (temp_azimuth > 180 && degree < 180)){ degree = 360 - degree; }
		displayBoth(true, 1, temp_azimuth, degree);
	}

	if (document.getElementById('side-item-1').style.display != 'none'){
		degree = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));

		if ( ((temp_azimuth > 270 || temp_azimuth < 90) && degree>180)
		|| ((temp_azimuth < 270 && temp_azimuth > 90) && degree<180) ){ degree = 360 - degree; }
		displayBoth(false, 1, temp_azimuth, degree);
	}

	document.getElementById('p-azimuth').innerHTML = temp_azimuth + " degrees";
	curr_azimuth = temp_azimuth;
	document.getElementById('circular1').style.transform = 'rotate('+temp_azimuth+'deg)';

	current_elevation = (curr_elevation == undefined ? 0 : curr_elevation);
	displayBall((curr_azimuth-180), current_elevation, 1);

	value = temp_azimuth;
	timestamp = Date.now();
	action_type = 'azimuth';
	ajax_interaction();
}

function move_azimuth_minus(e){
	e.preventDefault();

	if (document.getElementById('head-item-1').style.display == 'none'){ 
		window.alert("Please annotate or click to select an annotation first using the 2D views"); 
		return false; 
	}

	temp_azimuth = parseInt(document.getElementById('p-azimuth').innerHTML) - 1;
	temp_azimuth = (temp_azimuth == 360 ? temp_azimuth = 0 : temp_azimuth);

	if (document.getElementById('front-item-1').style.display != 'none'){
		degree = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));

		if ((temp_azimuth < 180 && degree > 180) || (temp_azimuth > 180 && degree < 180)){ degree = 360 - degree; }
		displayBoth(true, 1, temp_azimuth, degree);
	}

	if (document.getElementById('side-item-1').style.display != 'none'){
		degree = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));

		if ( ((temp_azimuth > 270 || temp_azimuth < 90) && degree>180)
		|| ((temp_azimuth < 270 && temp_azimuth > 90) && degree<180) ){ degree = 360 - degree; }
		displayBoth(false, 1, temp_azimuth, degree);
	}

	document.getElementById('p-azimuth').innerHTML = temp_azimuth + " degrees";
	curr_azimuth = temp_azimuth;
	document.getElementById('circular1').style.transform = 'rotate('+temp_azimuth+'deg)';

	current_elevation = (curr_elevation == undefined ? 0 : curr_elevation);
	displayBall((curr_azimuth-180), current_elevation, 1);

	value = temp_azimuth;
	timestamp = Date.now();
	action_type = 'azimuth';
	ajax_interaction();
}

function move_elevation_plus(e){
	e.preventDefault();

	if (document.getElementById('front-item-1').style.display == 'none' 
	&& document.getElementById('side-item-1').style.display == 'none' ){
		window.alert("Please annotate or click to select an annotation first using the 2D views"); 
		return false; 
	}

	new_elevation = parseInt(document.getElementById('p-elevation').innerHTML) + 1;
	if (new_elevation > 90) { return false; }

	if (document.getElementById('front-item-1').style.display != 'none'){
		document.getElementById('p-elevation').innerHTML = new_elevation + " degrees";
		curr_elevation = new_elevation;

		old_elevation_degree = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));
		if (old_elevation_degree < 180){
			new_elevation_degree = old_elevation_degree-1;
			document.getElementById('circularF1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth == undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
		else {
			new_elevation_degree = old_elevation_degree+1;
			document.getElementById('circularF1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth == undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
	}
	if (document.getElementById('side-item-1').style.display != 'none'){
		document.getElementById('p-elevation').innerHTML = new_elevation + " degrees";
		curr_elevation = new_elevation;

		old_elevation_degree = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));
		if (old_elevation_degree < 180){
			new_elevation_degree = old_elevation_degree-1;
			document.getElementById('circularS1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth == undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
		else {
			new_elevation_degree = old_elevation_degree+1;
			document.getElementById('circularS1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth == undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
	}

	value = new_elevation;
	timestamp = Date.now();
	action_type = 'elevation';
	ajax_interaction();
}

function move_elevation_minus(e){
	e.preventDefault();
	if (document.getElementById('front-item-1').style.display == 'none' && document.getElementById('side-item-1').style.display == 'none' ){ 
		window.alert("Please annotate or click to select an annotation first using the 2D views"); 
		return false; 
	}

	new_elevation = parseInt(document.getElementById('p-elevation').innerHTML) - 1;
	if (new_elevation < (-90)) { return false; }

	if (document.getElementById('front-item-1').style.display != 'none'){
		degree = parseInt(document.getElementById('circular1').style.transform.replace('rotate(','').replace('deg)',''));
		document.getElementById('p-elevation').innerHTML = new_elevation + " degrees";
		curr_elevation = new_elevation;

		old_elevation_degree = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));

		if (old_elevation_degree < 180){
			new_elevation_degree = old_elevation_degree+1;
			document.getElementById('circularF1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth==undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
		else {
			new_elevation_degree = old_elevation_degree-1;
			document.getElementById('circularF1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth==undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
	}
	if (document.getElementById('side-item-1').style.display != 'none'){
		degree = parseInt(document.getElementById('circular1').style.transform.replace('rotate(','').replace('deg)',''));
		document.getElementById('p-elevation').innerHTML = new_elevation + " degrees";
		curr_elevation = new_elevation;

		old_elevation_degree = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));

		if (old_elevation_degree < 180){
			new_elevation_degree = old_elevation_degree+1;
			document.getElementById('circularS1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth==undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
		else {
			new_elevation_degree = old_elevation_degree-1;
			document.getElementById('circularS1').style.transform = 'rotate('+new_elevation_degree+'deg)';
			displayBall((curr_azimuth==undefined ? -180 : curr_azimuth-180), new_elevation, 1);
		}
	}

	value = new_elevation;
	timestamp = Date.now();
	action_type = 'elevation';
	ajax_interaction();
}

function dragElement(index,indicator){
	var item, itemF, itemS;

	item = document.getElementById('circular1'); 
	inner_item = document.getElementById('head-item-1'); 
	frame = document.getElementById('head');

	itemF = document.getElementById('circularF1'); 
	inner_itemF = document.getElementById('front-item-1'); 
	frameF = document.getElementById('front');

	itemS = document.getElementById('circularS1'); 
	inner_itemS = document.getElementById('side-item-1'); 
	frameS = document.getElementById('side');

	original_head_degree = parseInt(document.getElementById('circular1').style.transform.replace('rotate(','').replace('deg)',''));
	original_front_degree = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));
	original_side_degree = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));

	itemS.onmousedown = function(){
		if(suppress) {
			document.onmousedown = null;
			document.onmouseup = null;
			document.onmousemove = null;
			return;
		}

		document.onmousemove = mouse;
		document.onmouseup = function(){
			if(not_moving){
				document.onmousedown = null;
				document.onmouseup = null;
				document.onmousemove = null;
				return;
			}

			temp_azimuthS = parseInt(document.getElementById('circularS'+index).style.transform.replace('rotate(','').replace('deg)',''));

			if (document.getElementById('head-item-'+index).style.display != 'none'){
				degree = parseInt(document.getElementById('circular'+index).style.transform.replace('rotate(','').replace('deg)',''));

				if ( ((degree < 90 || degree > 270) && (temp_azimuthS > 180)) || ((degree > 90 && degree < 270) && (temp_azimuthS < 180)) ){
					window.alert("The annotation for the vertical location is inconsistent with the annotation for the horizontal location");
					itemS.style.transform = 'rotate('+original_side_degree+'deg)';
					document.getElementById('p-elevation').innerHTML = curr_elevation + " degrees";

					// prevent undesired behaviors
					document.onmousedown = null;
					document.onmouseup = null;
					document.onmousemove = null;
					return;
				}

				if (curr_azimuth >= 22.5 && curr_azimuth <= 67.5) {
					document.getElementById('circularF1').setAttribute('style','');
					document.getElementById('front-item-1').setAttribute('style','');
					document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuthS+'deg)';
				}
				else if (curr_azimuth >= 112.5 && curr_azimuth <= 157.5) {
					document.getElementById('circularF1').setAttribute('style','');
					document.getElementById('front-item-1').setAttribute('style','');
					document.getElementById('circularF1').style.transform = 'rotate('+(360-temp_azimuthS)+'deg)';
				}
				else if (curr_azimuth >= 202.5 && curr_azimuth <= 247.5) {
					document.getElementById('circularF1').setAttribute('style','');
					document.getElementById('front-item-1').setAttribute('style','');
					document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuthS+'deg)';
				}
				else if (curr_azimuth >= 292.5 && curr_azimuth <= 337.5) {
					document.getElementById('circularF1').setAttribute('style','');
					document.getElementById('circularF1').style.transform = 'rotate('+(360-temp_azimuthS)+'deg)';
					document.getElementById('front-item-1').setAttribute('style','');
				}
				else{
					document.getElementById('front-item-1').style.display = 'none';
					document.getElementById('circularF1').style.display = 'none';
				}
			}

			displayBall( (curr_azimuth != undefined ? curr_azimuth - 180 : -180) , curr_elevation, index);
			curr_elevation = curr_elevation;


			value = curr_elevation;
			timestamp = Date.now();
			action_type = "elevation";
			ajax_interaction();

			suppress = true;
			not_moving = true;

			// prevent undesired behaviors
			document.onmousedown = null;
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}

	itemF.onmousedown = function(){
		if(suppress) {
			// prevent undesired behaviors
			document.onmousedown = null;
			document.onmouseup = null;
			document.onmousemove = null;
			return; 
		}

		document.onmousemove = mouse;
		document.onmouseup = function(e){
			if (not_moving){
				// prevent undesired behaviors
				document.onmousedown = null;
				document.onmouseup = null;
				document.onmousemove = null;
				return;
			}

			temp_azimuthF = parseInt(document.getElementById('circularF'+index).style.transform.replace('rotate(','').replace('deg)',''));

			if (document.getElementById('head-item-'+index).style.display != 'none'){
				degree = parseInt(document.getElementById('circular'+index).style.transform.replace('rotate(','').replace('deg)',''));

				if ( (degree < 180 && temp_azimuthF > 180) || (degree > 180 && temp_azimuthF < 180) ){
					window.alert("The annotation for the vertical location is inconsistent with the annotation for the horizontal location");
					itemF.style.transform = 'rotate('+original_front_degree+'deg)';
					document.getElementById('p-elevation').innerHTML = curr_elevation + " degrees";

					// prevent undesired behaviors
					document.onmousedown = null;
					document.onmouseup = null;
					document.onmousemove = null;
					return;
				}

				if (curr_azimuth >= 22.5 && curr_azimuth <= 67.5) {
					document.getElementById('circularS'+index).setAttribute('style','');
					document.getElementById('circularS'+index).style.transform = 'rotate('+temp_azimuthF+'deg)';
					document.getElementById('side-item-'+index).setAttribute('style','');
				}
				else if (curr_azimuth >= 112.5 && curr_azimuth <= 157.5) {
					document.getElementById('circularS'+index).setAttribute('style','');
					document.getElementById('circularS'+index).style.transform = 'rotate('+(360-temp_azimuthF)+'deg)';
					document.getElementById('side-item-'+index).setAttribute('style','');
				}
				else if (curr_azimuth >= 202.5 && curr_azimuth <= 247.5) {
					document.getElementById('circularS'+index).setAttribute('style','');
					document.getElementById('circularS'+index).style.transform = 'rotate('+temp_azimuthF+'deg)';
					document.getElementById('side-item-'+index).setAttribute('style','');
				}
				else if (curr_azimuth >= 292.5 && curr_azimuth <= 337.5) {
					document.getElementById('circularS'+index).setAttribute('style','');
					document.getElementById('circularS'+index).style.transform = 'rotate('+(360-temp_azimuthF)+'deg)';
					document.getElementById('side-item-'+index).setAttribute('style','');
				}
				else{
					document.getElementById('side-item-'+index).style.display = 'none';
					document.getElementById('circularS'+index).style.display = 'none';
				}
			}

			displayBall( (curr_azimuth != undefined ? curr_azimuth - 180 : -180) , curr_elevation, index);
			curr_elevation = curr_elevation;

			value = curr_elevation;
			timestamp = Date.now();
			action_type = "elevation";
			ajax_interaction();

			suppress = true;
			not_moving = true;

			// prevent undesired behaviors
			document.onmousedown = null;
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}

	item.onmousedown = function() {
		if (suppress) return;

   		document.onmousemove = mouse;
		document.onmouseup = function(e) {
			if (suppress) return; 
			e.preventDefault();
			suppress = true;

			temp_azimuth = parseInt(document.getElementById('p-azimuth').innerHTML);

			if (document.getElementById('front-item-'+index).style.display != 'none'){
				degree = parseInt(document.getElementById('circularF'+index).style.transform.replace('rotate(','').replace('deg)',''));

				if ((temp_azimuth < 180 && degree > 180) || (temp_azimuth > 180 && degree < 180)){ degree = 360 - degree; }
				displayBoth(true, index, temp_azimuth, degree);
			}

			if (document.getElementById('side-item-'+index).style.display != 'none'){
				degree = parseInt(document.getElementById('circularS'+index).style.transform.replace('rotate(','').replace('deg)',''));

				if ( ((temp_azimuth > 270 || temp_azimuth < 90) && degree>180)
					|| ((temp_azimuth < 270 && temp_azimuth > 90) && degree<180) ){ degree = 360 - degree; }
				displayBoth(false, index, temp_azimuth, degree);
			}

			displayBall(temp_azimuth-180, (curr_elevation != undefined ? curr_elevation : 0), index);
			curr_azimuth = temp_azimuth;

			value = curr_azimuth;
			timestamp = Date.now();
			action_type = "elevation";
			ajax_interaction();

			suppress = true;
			not_moving = true;

			// prevent undesired behaviors
			document.onmousedown = null;
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}

	function mouse(e) {
		if (indicator == 1) {
			var ilocationF = itemF.getBoundingClientRect();
			var cxF = (ilocationF.right + ilocationF.left) / 2;
			var cyF = (ilocationF.top + ilocationF.bottom) / 2;
			var temp_azimuthF = calculateAzimuth(e.pageX, e.pageY, cxF, cyF);
			temp_azimuthF = (temp_azimuthF == 360 ? 0 : temp_azimuthF);

			if (temp_azimuthF <= 180){ curr_elevation = 90 - temp_azimuthF; }
			else{ curr_elevation = (temp_azimuthF - 180) - 90 }

			itemF.style.transform = 'rotate('+temp_azimuthF+'deg)';
			document.getElementById('p-azimuth').innerHTML = (curr_azimuth != undefined ? curr_azimuth : 0) + " degrees";
			document.getElementById('p-elevation').innerHTML = curr_elevation + " degrees";
		}
		else if (indicator == 2){
			var ilocationS = itemS.getBoundingClientRect();
			var cxS = (ilocationS.right + ilocationS.left) / 2;
			var cyS = (ilocationS.top + ilocationS.bottom) / 2;
			var temp_azimuthS = calculateAzimuth(e.pageX, e.pageY, cxS, cyS);
			temp_azimuthS = (temp_azimuthS == 360 ? 0 : temp_azimuthS);

			if (temp_azimuthS <= 180){ curr_elevation = 90 - temp_azimuthS; }
			else{ curr_elevation = (temp_azimuthS - 180) - 90 }

			itemS.style.transform = 'rotate('+temp_azimuthS+'deg)';
			document.getElementById('p-azimuth').innerHTML = (curr_azimuth != undefined ? curr_azimuth: 0) + " degrees";
			document.getElementById('p-elevation').innerHTML = curr_elevation + " degrees";
		}
		else{
			var ilocation = item.getBoundingClientRect();
			var cx = (ilocation.right + ilocation.left) / 2;
			var cy = (ilocation.top + ilocation.bottom) / 2;
			var temp_azimuth = calculateAzimuth(e.pageX, e.pageY, cx, cy);
			temp_azimuth = (temp_azimuth == 360 ? 0 : temp_azimuth);

			item.style.transform = 'rotate('+temp_azimuth+'deg)';
			document.getElementById('p-azimuth').innerHTML = temp_azimuth + " degrees";
			document.getElementById('p-elevation').innerHTML = (curr_elevation != undefined ? curr_elevation : 0) + " degrees";
		}
		suppress = false;
		not_moving = false;
	}
}

function calculateAzimuth(x,y,cx,cy){
	var newx, newy;
	if ( x>cx && y<cy ){
		newx = x - cx;
		newy = cy - y;
		arccosine = Math.acos(newy / (Math.sqrt(Math.pow(newx,2) + Math.pow(newy,2))));
		return Math.round(arccosine * (180 / Math.PI));
	}
	else if ( x>cx && y>cy ){
		newx = x - cx;
		newy = y - cy;
		arccosine = Math.acos(newx / (Math.sqrt(Math.pow(newx,2) + Math.pow(newy,2))));
		return Math.round(arccosine * (180 / Math.PI)) + 90;
	}
	else if ( x < cx && y > cy ){
		newx = cx - x;
		newy = cy - y;
		arccosine = Math.acos(newx / (Math.sqrt(Math.pow(newx,2) + Math.pow(newy,2))));
		return 270 - Math.round(arccosine * (180 / Math.PI));
	}
	else{
		newx = cx - x;
		newy = y - cy;
		arccosine = Math.acos(newx / (Math.sqrt(Math.pow(newx,2) + Math.pow(newy,2))));
		return Math.round(arccosine * (180 / Math.PI)) + 270;
	}
}

function calculateRadius(mouseX, mouseY, frameX, frameY){
	x = frameX - mouseX;
	y = frameY - mouseY;
	radius = Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
	if ( radius <= 100 ) return true;
	else return false;
}

function calculate3dClick(mouseX, mouseY, frameX, frameY){
	x = frameX - mouseX;
	y = frameY - mouseY;
	radius = Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
	if ( radius <= 200 ) return true;
	else return false;
}

var enable_head = false;
var enable_front = false;
var enable_side = false;
var delete_annotation = false;
var add_third = false;

document.addEventListener("click", keyboardEvents);
function keyboardEvents(e){
	
	if(e.metaKey){
		document.getElementById('body').style.cursor = "url('/templates/interface/img/minus.svg'), auto";

		// disable adding events
		enable_head = false; 
		enable_front = false; 
		enable_side = false;

		// enable deleting events
		delete_annotation = true;

		// prevent dragging event
		suppress = true;
		
		return;
	}

	// set up to get location
	document.getElementById('circular').setAttribute('style','');
	document.getElementById('circularF').setAttribute('style','');
	document.getElementById('circularS').setAttribute('style','');

	head_frameLocation = document.getElementById('circular').getBoundingClientRect();
	front_frameLocation = document.getElementById('circularF').getBoundingClientRect();
	side_frameLocation = document.getElementById('circularS').getBoundingClientRect();
	three_frameLocation = document.getElementById('3d-head').getBoundingClientRect();

	head_cx = ( head_frameLocation.right + head_frameLocation.left ) / 2;
	head_cy = ( head_frameLocation.top + head_frameLocation.bottom ) / 2;
	front_cx = ( front_frameLocation.right + front_frameLocation.left ) / 2;
	front_cy = ( front_frameLocation.top + front_frameLocation.bottom ) / 2;
	side_cx = ( side_frameLocation.right + side_frameLocation.left ) / 2;
	side_cy = ( side_frameLocation.top + side_frameLocation.bottom ) / 2;
	three_cx = ( three_frameLocation.right + three_frameLocation.left ) / 2;
	three_cy = ( three_frameLocation.top + three_frameLocation.bottom ) / 2;

	if (e.altKey){
		// disable deleting events
		delete_annotation = false;

		document.getElementById('body').style.cursor = 'cell';

		key_perform = true;

		document.addEventListener('mousedown', function(e){

			enable_head = calculateRadius(e.pageX, e.pageY, head_cx, head_cy);
			enable_front = calculateRadius(e.pageX, e.pageY, front_cx, front_cy);
			enable_side = calculateRadius(e.pageX, e.pageY, side_cx, side_cy);
			click_3d_head = calculate3dClick(e.pageX, e.pageY, three_cx, three_cy);

			if (click_3d_head){
				window.alert("Please annotate the sound using the 2D views"); 
				document.getElementById('body').style.cursor = 'default'; 
				key_perform = false;
				document.onclick = null;
				document.onkeydown = null; 
				return;
			}

			if (enable_head){
				if ( azimuth_item_index == 1 ){
					window.alert("You have already annotated the horizontal location"); 
					document.getElementById('body').style.cursor = 'default'; 
					key_perform = false;
					enable_head = false;

					// prevent undesired events
					document.onclick = null;
					document.onkeydown = null; 
					return;
				}

				if ( azimuth_item_index > elevation_item_index ) {
					window.alert("You can’t annotate more horizontal location " + azimuth_item_index + " " + elevation_item_index); 
					document.getElementById('body').style.cursor = 'default'; 
					key_perform = false;
					enable_head = false;

					// prevent undesired events
					document.onclick = null;
					document.onkeydown = null; 
					return;
				}

				curr_azimuth = calculateAzimuth(e.pageX, e.pageY, head_cx, head_cy);
				curr_azimuth = (curr_azimuth == 360 ? 0 : curr_azimuth);

				if ( document.getElementById('front-item-1').style.display != 'none' ){
					original_front = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));
					if ( (original_front < 180 && curr_azimuth > 180)
					|| (original_front > 180 && curr_azimuth < 180) ) {
						window.alert("The annotation for the horizontal location is inconsistent with the annotation for the vertical location"); 
						document.getElementById('body').style.cursor = 'default'; 
						key_perform = false;
						enable_head = false;

						// prevent undesired events
						document.onclick = null;
						document.onkeydown = null;
						return;
					}

					degree = parseInt(document.getElementById('circularF1').style.transform.replace('rotate(','').replace('deg)',''));
					
					if ((curr_azimuth < 180 && degree > 180) || (curr_azimuth > 180 && degree < 180)){
						document.getElementById('circularF1').style.transform = 'rotate('+(360-degree)+'deg)';
					}

					if (curr_azimuth < 22.5 || curr_azimuth > 337.5){
						document.getElementById('front-item-1').style.display = 'none';
						document.getElementById('circularF1').style.display = 'none';

						document.getElementById('side-item-1').style.display = '';
						document.getElementById('circularS1').style.display = '';
						if (degree > 180){ document.getElementById('circularS1').style.transform = 'rotate('+(360-degree)+'deg)'; }
						else{ document.getElementById('circularS1').style.transform = 'rotate('+degree+'deg)'; }
					}
					else if (curr_azimuth > 67.5 && curr_azimuth < 112.5){
						document.getElementById('side-item-1').style.display = 'none';
						document.getElementById('circularS1').style.display = 'none';
					}
					else if (curr_azimuth > 157.5 && curr_azimuth < 202.5){ 
						document.getElementById('front-item-1').style.display = 'none';
						document.getElementById('circularF1').style.display = 'none';

						document.getElementById('side-item-1').style.display = '';
						document.getElementById('circularS1').style.display = '';
						if (degree < 180){ document.getElementById('circularS1').style.transform = 'rotate('+(360-degree)+'deg)'; }
						else{ document.getElementById('circularS1').style.transform = 'rotate('+degree+'deg)'; }
					}
					else if (curr_azimuth > 247.5 && curr_azimuth < 292.5){
						document.getElementById('side-item-1').style.display = 'none';
						document.getElementById('circularS1').style.display = 'none';
					}
					else{
						document.getElementById('side-item-1').style.display = '';
						document.getElementById('circularS1').style.display = '';
						if (curr_azimuth > 270 || curr_azimuth < 90){
							if (degree < 180){ document.getElementById('circularS1').style.transform = 'rotate('+degree+'deg)'; }
							else{ document.getElementById('circularS1').style.transform = 'rotate('+(360-degree)+'deg)';  }
						}
						else if (curr_azimuth < 270 && curr_azimuth > 90){
							if (degree > 180){ document.getElementById('circularS1').style.transform = 'rotate('+degree+'deg)';  }
							else{ document.getElementById('circularS1').style.transform = 'rotate('+(360-degree)+'deg)';  }
						}
					}

				}
				else if ( document.getElementById('side-item-1').style.display != 'none' ){
					original_side = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));
					if ( ((curr_azimuth < 90 || curr_azimuth > 270) && (original_side > 180))
					|| ((curr_azimuth > 90 && curr_azimuth < 270) && (original_side < 180)) ) {
						window.alert("The annotation for the horizontal location is inconsistent with the annotation for the vertical location");
						document.getElementById('body').style.cursor = 'default'; 
						key_perform = false;
						enable_head = false;

						// prevent undesired events
						document.onclick = null;
						document.onkeydown = null;
						return;
					}

					degree = parseInt(document.getElementById('circularS1').style.transform.replace('rotate(','').replace('deg)',''));

					if ( ((curr_azimuth > 270 || curr_azimuth < 90) && degree>180)
						|| ((curr_azimuth < 270 && curr_azimuth > 90) && degree<180) ){
							document.getElementById('circularS1').style.transform = 'rotate('+(360-degree)+'deg)'; 
					}

					if (curr_azimuth < 22.5 || curr_azimuth > 337.5){
						document.getElementById('front-item-1').style.display = 'none';
						document.getElementById('circularF1').style.display = 'none';
					}
					else if (curr_azimuth > 67.5 && curr_azimuth < 112.5){
						document.getElementById('side-item-1').style.display = 'none';
						document.getElementById('circularS1').style.display = 'none';

						document.getElementById('front-item-1').style.display = '';
						document.getElementById('circularF1').style.display = '';
						if (degree > 180){ document.getElementById('circularF1').style.transform = 'rotate('+(360-degree)+'deg)'; }
						else{ document.getElementById('circularF1').style.transform = 'rotate('+degree+'deg)'; }
					}
					else if (curr_azimuth > 157.5 && curr_azimuth < 202.5){ 
						document.getElementById('front-item-1').style.display = 'none';
						document.getElementById('circularF1').style.display = 'none';
					}
					else if (curr_azimuth > 247.5 && curr_azimuth < 292.5){
						document.getElementById('side-item-1').style.display = 'none';
						document.getElementById('circularS1').style.display = 'none';

						document.getElementById('front-item-1').style.display = '';
						document.getElementById('circularF1').style.display = '';
						if (degree < 180){ document.getElementById('circularF1').style.transform = 'rotate('+(360-degree)+'deg)'; }
						else{ document.getElementById('circularF1').style.transform = 'rotate('+degree+'deg)'; }
					}
					else{
						document.getElementById('front-item-1').style.display = '';
						document.getElementById('circularF1').style.display = '';
						if (curr_azimuth < 180){
							if (degree > 180){ document.getElementById('circularF1').style.transform = 'rotate('+(360-degree)+'deg)'; }
							else{ document.getElementById('circularF1').style.transform = 'rotate('+degree+'deg)';  }
						}
						else if (curr_azimuth > 180){
							if (degree < 180){ document.getElementById('circularF1').style.transform = 'rotate('+(360-degree)+'deg)';  }
							else{ document.getElementById('circularF1').style.transform = 'rotate('+degree+'deg)'; }
						}
					}
				}

				azimuth_item_index += 1;

				document.getElementById('circular1').setAttribute('style','');
				document.getElementById('circular1').style.transform = 'rotate('+curr_azimuth+'deg)';
				document.getElementById('head-item-1').setAttribute('style','');

				displayBall(curr_azimuth - 180, (curr_elevation != undefined ? curr_elevation : 0) , 1);

				document.getElementById('p-azimuth').innerHTML = curr_azimuth + " degrees";
				document.getElementById('p-elevation').innerHTML = (curr_elevation != undefined ? curr_elevation : 0) + " degrees";

				color_hex = '000000'+color.toString(16);
				document.getElementById('azimuth-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
				document.getElementById('elevation-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);

				key_perform = false;
				enable_head = false;

				// prevent undesired events
				document.onclick = null;
				document.onkeydown = null;

				value = (curr_azimuth == 360 ? 0 : curr_azimuth);
				timestamp = Date.now();
				action_type = 'azimuth';
				ajax_interaction();
			}
			else if (enable_front){
				if ( elevation_item_index == 1 ){
					window.alert("You have already annotated the vertical location"); 
					document.getElementById('body').style.cursor = 'default'; 
					key_perform = false;
					enable_front = false;

					// prevent undesired events
					document.onclick = null;
					document.onkeydown = null;
					return;
				}

				if (elevation_item_index > azimuth_item_index) {
					window.alert("You can’t annotate more vertical location"); 
					document.getElementById('body').style.cursor = 'default'; 
					key_perform = false;
					enable_front = false;

					// prevent undesired events
					document.onclick = null;
					document.onkeydown = null;
					return;
				}

				temp_azimuth = calculateAzimuth(e.pageX, e.pageY, front_cx, front_cy);

				if (curr_azimuth != undefined){

					if (curr_azimuth > 180 && temp_azimuth < 180){ temp_azimuth = 360 - temp_azimuth; }
					else if (curr_azimuth < 180 && temp_azimuth > 180){ temp_azimuth = 360 - temp_azimuth; }

					if (curr_azimuth >= 22.5 && curr_azimuth <= 67.5) {
						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');

						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');
					}
					else if (curr_azimuth >= 112.5 && curr_azimuth <= 157.5) {
						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');

						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');
					}
					else if (curr_azimuth >= 202.5 && curr_azimuth <= 247.5) {
						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');

						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');
					}
					else if (curr_azimuth >= 292.5 && curr_azimuth <= 337.5) {
						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');

						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');
					}
					else{
						if (curr_azimuth > 157.5 && curr_azimuth <= 180){
							document.getElementById('circularS1').setAttribute('style','');
							document.getElementById('circularS1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
							document.getElementById('side-item-1').setAttribute('style','');
						}
						else if (curr_azimuth < 202.5 && curr_azimuth > 180){
							document.getElementById('circularS1').setAttribute('style','');
							document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
							document.getElementById('side-item-1').setAttribute('style','');
						}
						else if (curr_azimuth > 337.5){
							document.getElementById('circularS1').setAttribute('style','');
							document.getElementById('circularS1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
							document.getElementById('side-item-1').setAttribute('style','');
						}
						else if (curr_azimuth < 22.5){
							document.getElementById('circularS1').setAttribute('style','');
							document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
							document.getElementById('side-item-1').setAttribute('style','');
						}
						else{
							document.getElementById('circularF1').setAttribute('style','');
							document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
							document.getElementById('front-item-1').setAttribute('style','');
						}
					}
				}
				else{
					document.getElementById('circularF1').setAttribute('style','');
					document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
					document.getElementById('front-item-1').setAttribute('style','');
				}

				elevation_item_index += 1;

				// calculate the displayed elevation
				if (temp_azimuth <= 180){ curr_elevation = 90 - temp_azimuth; }
				else{ curr_elevation = (temp_azimuth - 180) - 90 }
				
				temp_azimuth = curr_azimuth != undefined ? curr_azimuth - 180 : -180;

				displayBall(temp_azimuth, curr_elevation, 1);

				// display azimuth and elevation
				document.getElementById('p-azimuth').innerHTML = (curr_azimuth != undefined ? curr_azimuth : 0) + " degrees";
				document.getElementById('p-elevation').innerHTML = curr_elevation + " degrees";

				// color display
				color_hex = '000000'+color.toString(16);
				document.getElementById('azimuth-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
				document.getElementById('elevation-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);

				enable_front = false; 

				key_perform = false;
				enable_front = false;

				// prevent undesired events
				document.onclick = null;
				document.onkeydown = null;

				value = curr_elevation
				timestamp = Date.now();
				action_type = 'elevation'
				ajax_interaction();
			}
			else if (enable_side){
				if (elevation_item_index == 1){
					window.alert("You have already annotated the vertical location"); 
					document.getElementById('body').style.cursor = 'default';
					key_perform = false;
					enable_side = false;

					// prevent undesired events
					document.onclick = null;
					document.onkeydown = null;
					return;
				}

				if (elevation_item_index > azimuth_item_index) {
					window.alert("You can’t annotate more vertical location"); 
					document.getElementById('body').style.cursor = 'default'; 
					key_perform = false;
					enable_side = false;

					// prevent undesired events
					document.onclick = null;
					document.onkeydown = null;
					return;
				}

				temp_azimuth = calculateAzimuth(e.pageX, e.pageY, side_cx, side_cy);

				if (curr_azimuth != undefined){

					if (curr_azimuth < 90 || curr_azimuth > 270){ if (temp_azimuth > 180){ temp_azimuth = 360 - temp_azimuth; } }
					else if (curr_azimuth > 90 && curr_azimuth < 270){ if (temp_azimuth < 180){ temp_azimuth = 360 - temp_azimuth; } }
					
					if (curr_azimuth >= 22.5 && curr_azimuth <= 67.5) {
						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');

						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');
					}
					else if (curr_azimuth >= 112.5 && curr_azimuth <= 157.5) {
						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');

						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');
					}
					else if (curr_azimuth >= 202.5 && curr_azimuth <= 247.5) {
						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');

						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');
					}
					else if (curr_azimuth >= 292.5 && curr_azimuth <= 337.5) {
						document.getElementById('circularF1').setAttribute('style','');
						document.getElementById('circularF1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
						document.getElementById('front-item-1').setAttribute('style','');

						document.getElementById('circularS1').setAttribute('style','');
						document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
						document.getElementById('side-item-1').setAttribute('style','');
					}
					else{
						if (curr_azimuth > 67.5 && curr_azimuth <= 90){
							document.getElementById('circularF1').setAttribute('style','');
							document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
							document.getElementById('front-item-1').setAttribute('style','');
						}
						else if (curr_azimuth > 90 && curr_azimuth < 112.5){
							document.getElementById('circularF1').setAttribute('style','');
							document.getElementById('circularF1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
							document.getElementById('front-item-1').setAttribute('style','');
						}
						else if (curr_azimuth > 257.5 && curr_azimuth <= 270){
							document.getElementById('circularF1').setAttribute('style','');
							document.getElementById('circularF1').style.transform = 'rotate('+temp_azimuth+'deg)';
							document.getElementById('front-item-1').setAttribute('style','');
						}
						else if (curr_azimuth > 270 && curr_azimuth < 292.5){
							document.getElementById('circularF1').setAttribute('style','');
							document.getElementById('circularF1').style.transform = 'rotate('+(360-temp_azimuth)+'deg)';
							document.getElementById('front-item-1').setAttribute('style','');
						}
						else{
							document.getElementById('circularS1').setAttribute('style','');
							document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
							document.getElementById('side-item-1').setAttribute('style','');
						}
					}
				}
				else{
					document.getElementById('circularS1').setAttribute('style','');
					document.getElementById('circularS1').style.transform = 'rotate('+temp_azimuth+'deg)';
					document.getElementById('side-item-1').setAttribute('style','');
				}

				elevation_item_index += 1;

				// calculate the displayed elevation
				if (temp_azimuth <= 180){ curr_elevation = 90 - temp_azimuth; }
				else{ curr_elevation = (temp_azimuth - 180) - 90 }

				temp_azimuth = curr_azimuth != undefined ? curr_azimuth - 180 : -180;

				displayBall(temp_azimuth, curr_elevation, 1);

				// display azimuth and elevation
				document.getElementById('p-azimuth').innerHTML = (curr_azimuth != undefined ? curr_azimuth : 0) + " degrees";
				document.getElementById('p-elevation').innerHTML = curr_elevation + " degrees";

				// color display
				color_hex = '000000'+color.toString(16);
				document.getElementById('azimuth-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
				document.getElementById('elevation-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);

				enable_side = false;

				// prevent undesired events
				document.onclick = null;
				document.onkeydown = null;

				value = curr_elevation
				timestamp = Date.now();
				action_type = 'elevation'
				ajax_interaction();
			}

			key_perform = false;

		}, {once:true});
	}
	return;
}

function reloadAll(){
	document.getElementById("user_note").value = "";
	curr_azimuth = undefined;
	curr_elevation = undefined;
	azimuth_item_index = 0;
	elevation_item_index = 0;
	document.getElementById('circular1').style.display = 'none';
	document.getElementById('circularF1').style.display = 'none';
	document.getElementById('circularS1').style.display = 'none';
	document.getElementById('head-item-1').style.display = 'none';
	document.getElementById('front-item-1').style.display = 'none';
	document.getElementById('side-item-1').style.display = 'none';
	document.getElementById('p-azimuth').innerHTML = '';
	document.getElementById('p-elevation').innerHTML = '';
	document.getElementById('azimuth-dot').style.backgroundColor = '';
	document.getElementById('elevation-dot').style.backgroundColor = '';
	document.onmousedown = null; 
	document.onkeydown = null;
	removeAllBalls();
}

document.getElementById('head-item-1').addEventListener("mousedown",function(e){
	e.preventDefault(); // Prevent dragging text event of the current draggable

	if (delete_annotation){
		suppress = true;

		document.getElementById('head-item-1').style.display = 'none';
		document.getElementById('front-item-1').style.display = 'none';
		document.getElementById('side-item-1').style.display = 'none';
		document.getElementById('circular1').style.display = 'none';
		document.getElementById('circularF1').style.display = 'none';
		document.getElementById('circularS1').style.display = 'none';

		document.getElementById('azimuth-dot').style.backgroundColor = 'white';
		document.getElementById('elevation-dot').style.backgroundColor = 'white';
		document.getElementById('p-azimuth').innerHTML = '';
		document.getElementById('p-elevation').innerHTML = '';

		elevation_item_index = 0;
		azimuth_item_index = 0;
		curr_azimuth = undefined;
		curr_elevation = undefined;

		key_perform = false;
		deleteBall(1);

		// disable further deletion
		delete_annotation = false;
		e.metaKey = false;

		// prevent undesired events
		document.onmousedown = null; 
		document.onkeydown = null;
	}
	else if (document.getElementById('body').style.cursor == 'default') {
		document.getElementById('p-azimuth').innerHTML = (curr_azimuth == undefined ? 0 : curr_azimuth) + " degrees";
		document.getElementById('p-elevation').innerHTML = (curr_elevation == undefined ? 0 : curr_elevation) + " degrees";
		color_hex = '000000'+color.toString(16);
		document.getElementById('azimuth-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
		document.getElementById('elevation-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);

		suppress = false;
		dragElement(1,0);
	}
});

document.getElementById('front-item-1').addEventListener("mousedown",function(e){
	e.preventDefault(); // Prevent dragging text event of the current draggable

	if (delete_annotation){
		suppress = true;

		document.getElementById('head-item-1').style.display = 'none';
		document.getElementById('front-item-1').style.display = 'none';
		document.getElementById('side-item-1').style.display = 'none';
		document.getElementById('circular1').style.display = 'none';
		document.getElementById('circularF1').style.display = 'none';
		document.getElementById('circularS1').style.display = 'none';

		document.getElementById('azimuth-dot').style.backgroundColor = 'white';
		document.getElementById('elevation-dot').style.backgroundColor = 'white';
		document.getElementById('p-azimuth').innerHTML = '';
		document.getElementById('p-elevation').innerHTML = '';
		
		elevation_item_index = 0;
		azimuth_item_index = 0;
		curr_azimuth = undefined;
		curr_elevation = undefined;

		key_perform = false;
		deleteBall(1);
		
		// disable further deletion
		delete_annotation = false;
		e.metaKey = false;

		// prevent undesired events
		document.onmousedown = null; 
		document.onkeydown = null;
	}
	else if (document.getElementById('body').style.cursor == 'default') {
		document.getElementById('p-azimuth').innerHTML = (curr_azimuth == undefined ? 0 : curr_azimuth) + " degrees";
		document.getElementById('p-elevation').innerHTML = (curr_elevation == undefined ? 0 : curr_elevation) + " degrees";
		color_hex = '000000'+color.toString(16);
		document.getElementById('azimuth-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
		document.getElementById('elevation-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
		suppress = false;
		dragElement(1,1);
	}
});

document.getElementById('side-item-1').addEventListener("mousedown",function(e){
	e.preventDefault(); // Prevent dragging text event of the current draggable

	if (delete_annotation){
		suppress = true;

		document.getElementById('head-item-1').style.display = 'none';
		document.getElementById('front-item-1').style.display = 'none';
		document.getElementById('side-item-1').style.display = 'none';
		document.getElementById('circular1').style.display = 'none';
		document.getElementById('circularF1').style.display = 'none';
		document.getElementById('circularS1').style.display = 'none';

		document.getElementById('azimuth-dot').style.backgroundColor = 'white';
		document.getElementById('elevation-dot').style.backgroundColor = 'white';
		document.getElementById('p-azimuth').innerHTML = '';
		document.getElementById('p-elevation').innerHTML = '';

		elevation_item_index = 0;
		azimuth_item_index = 0;
		curr_azimuth = undefined;
		curr_elevation = undefined;

		key_perform = false;
		deleteBall(1);
		
		// disable further deletion
		delete_annotation = false;
		e.metaKey = false;

		// prevent undesired events
		document.onmousedown = null; 
		document.onkeydown = null;
	}
	else if (document.getElementById('body').style.cursor == 'default') {
		document.getElementById('p-azimuth').innerHTML = (curr_azimuth == undefined ? 0 : curr_azimuth) + " degrees";
		document.getElementById('p-elevation').innerHTML = (curr_elevation == undefined ? 0 : curr_elevation) + " degrees";
		color_hex = '000000'+color.toString(16);
		document.getElementById('azimuth-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
		document.getElementById('elevation-dot').style.backgroundColor = '#'+color_hex.substring(color_hex.length-6,color_hex.length);
		suppress = false;
		dragElement(1,2);
	}
});

/* Three.js */

container = document.getElementById('3d-head');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
var light = new THREE.HemisphereLight(0xffffff, 1);
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

const clock = new THREE.Clock()

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

function deleteBall(number){ 
	/* These are just extra ensurance */
	document.getElementById('p-azimuth').innerHTML = '';
	document.getElementById('p-elevation').innerHTML = '';
	scene.remove(scene.getObjectByName('ball'+number)); 
}

function removeAllBalls(){
	var index = 0;
	while (index < 10){
		scene.remove(scene.getObjectByName('ball'+(index + 1)));
		index += 1;
	}
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