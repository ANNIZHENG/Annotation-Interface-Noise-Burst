const stereo_audio_path = "/templates/interface/assets/audio/stereo/";
const left_filename = "gaussian_rec_46_azimuth_270_elevation_0.wav";
const right_filename = "gaussian_rec_18_azimuth_90_elevation_0.wav";
var filenames = [];

document.addEventListener("click", function(e){
    if(e.target.innerHTML == "Play"){
        document.getElementById("audio"+e.target.id.substring(e.target.id.length-1)).play();
        document.getElementById(e.target.id).disabled = true;
    }
    if(e.target.type == "radio"){
        let id_number = e.target.id.replace('radio-','')[0];
        let side = e.target.id.substring(e.target.id.length-2) == 'ft' ? "left" : "right";
        if (side == "left") document.getElementById('radio-'+id_number+"-right").checked = false;
        else document.getElementById('radio-'+id_number+"-left").checked = false;
    }
});

function randomAssign(){
    while(true){
        let left = 0;
        let right = 0;
        for (let i = 0; i < 6 ; i++){
            let decide = Math.round(Math.random()); // 1 or 0, 1 for left, 0 for right
            if (decide) {
                left += 1;
                filenames.push(left_filename);
            }
            else {
                right += 1;
                filenames.push(right_filename);
            }
        }
        if (left >= 2 && right >= 2){
            break;
        }
        else{
            filenames = [];
        }
    }
}

function setUp(){
    randomAssign();
    // console.log(filenames);
    let division = document.getElementById('questions');
    for (let i = 0; i < 6; i++){
        let small_div = document.createElement('div');
        let new_audio = document.createElement('audio');
        new_audio.id = 'audio'+i;
        let new_source = document.createElement('source');
        new_source.type = "audio/wav";
        new_source.src = stereo_audio_path + filenames[i];

        let new_button = document.createElement('button');
        new_button.innerHTML = "Play";
        new_button.id = "button"+i;
        new_button.className = "audio-button";

        let span_left = document.createElement('span');
        span_left.innerHTML = "Left:";

        let left_input = document.createElement('input');
        left_input.type = "radio";
        left_input.id = "radio-"+i+'-left';
        left_input.className = "radio";

        let span_right = document.createElement('span');
        span_right.innerHTML = "Right:";

        let right_input = document.createElement('input');
        right_input.type = "radio";
        right_input.id = "radio-"+i+'-right';
        right_input.className = "radio";

        new_audio.appendChild(new_source);
        small_div.appendChild(new_audio);
        small_div.appendChild(new_button);
        small_div.appendChild(span_left);
        small_div.appendChild(left_input);
        small_div.appendChild(span_right);
        small_div.appendChild(right_input);
        division.appendChild(small_div);
    }
}

function ajax_interaction_pass(pass){
    let action_type = 'stereo screening: ';
    if (pass){
        action_type += 'pass';
    }
    else{
        action_type += 'fail';
    }

    let survey_id = localStorage.getItem("survey_id");
    let value = null;
    let timestamp = Date.now();
    let practice = 0;

    var request = new XMLHttpRequest();
    request.open('POST', '/interaction', true);
    request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
    var data = JSON.stringify({survey_id,action_type,value,timestamp,practice});
    request.send(data);
}

document.getElementById("submit").onclick = function(e){
    for (let i = 0; i < 6; i++){
        if (!document.getElementById('radio-'+i+"-left").checked && !document.getElementById('radio-'+i+"-right").checked){
            event.preventDefault();
            document.getElementById("main").style.display = 'none';
            let error_text = document.createElement('div');
            error_text.innerHTML = "Screening task failed. Your headphones do not meet the qualifications for the task.";
            document.getElementById("body").appendChild(error_text);
            ajax_interaction_pass(false);
            return;
        }
        if (document.getElementById('radio-'+i+"-left").checked){
            if (filenames[i] != left_filename) {
                event.preventDefault();
                document.getElementById("main").style.display = 'none';
                let error_text = document.createElement('div');
                error_text.innerHTML = "Screening task failed. Your headphones do not meet the qualifications for the task.";
                document.getElementById("body").appendChild(error_text);
                ajax_interaction_pass(false);
                return;
            }
        }
        else if (document.getElementById('radio-'+i+"-right").checked){
            if (filenames[i] != right_filename) {
                event.preventDefault();
                document.getElementById("main").style.display = 'none';
                let error_text = document.createElement('div');
                error_text.innerHTML = "Screening task failed. Your headphones do not meet the qualifications for the task.";
                document.getElementById("body").appendChild(error_text);
                ajax_interaction_pass(false);
                return;
            }
        }
    }
    ajax_interaction_pass(true);
    localStorage.setItem('stereo',1);
    window.location = '/templates/interface/interface.html';
};