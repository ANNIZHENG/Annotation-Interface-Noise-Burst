const stereo_audio_path = "/templates/interface/assets/audio/stereo/";
const left_filename = "gaussian_rec_46_azimuth_270_elevation_0.wav";
const right_filename = "gaussian_rec_18_azimuth_90_elevation_0.wav";
var filenames = [];

document.addEventListener("click", function(e){
    if(e.target.innerHTML == "Play"){
        document.getElementById("audio"+e.target.id.substring(e.target.id.length-1)).play();
    }
    if(e.target.type == "checkbox"){
        let id_number = e.target.id.replace('checkbox-','')[0];
        let side = e.target.id.substring(e.target.id.length-2) == 'ft' ? "left" : "right";
        if (side == "left") document.getElementById('checkbox-'+id_number+"-right").checked = false;
        else document.getElementById('checkbox-'+id_number+"-left").checked = false;
    }
});

function randomAssign(){
    while(true){
        for (let i = 0; i < 6 ; i++){
            let decide = Math.round(Math.random()); // 1 or 0, 1 for left, 0 for right
            if (decide) filenames.push(left_filename);
            else filenames.push(right_filename);
        }
        let left = 0;
        let right = 0;

        for (let j = 0; j < 6 ; j++){
            if (filenames[j] == left_filename) {
                left += 1;
            }
            else {
                right += 1;
            }
            if (left >= 2 && right >= 2) {
                return;
            }
        }
    }
}

function setUp(){
    randomAssign();
    console.log(filenames);
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
        left_input.type = "checkbox";
        left_input.id = "checkbox-"+i+'-left';
        left_input.className = "checkbox";

        let span_right = document.createElement('span');
        span_right.innerHTML = "Right:";

        let right_input = document.createElement('input');
        right_input.type = "checkbox";
        right_input.id = "checkbox-"+i+'-right';
        right_input.className = "checkbox";

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

document.getElementById("submit").onclick = function(e){
    let total_check = 0;
    for (let i = 0; i < 6; i++){
        if (!document.getElementById('checkbox-'+i+"-left").checked && !document.getElementById('checkbox-'+i+"-right").checked){
            event.preventDefault();
            window.alert("For each audio, please select either Left or Right");
            return;
        }
        if (document.getElementById('checkbox-'+i+"-left").checked){
            if (filenames[i] != left_filename) {
                event.preventDefault();
                window.alert("You've selected at least one wrong choice.");
                return;
            }
        }
        else if (document.getElementById('checkbox-'+i+"-right").checked){
            if (filenames[i] != right_filename) {
                event.preventDefault();
                window.alert("You've selected at least one wrong choice.");
                return;
            }
        }
    }
    window.location = '/templates/interface/interface.html';
};