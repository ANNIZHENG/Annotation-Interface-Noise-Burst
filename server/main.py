import uuid
from sqlalchemy import *
from sqlalchemy.sql import *
from datetime import datetime
from flask import *
from db_tables import ses,eng,Annotation,Survey,Location,Interaction
from random import randrange
app = Flask(__name__,static_folder="../templates",template_folder="..")


@app.route('/')
def home():
    result = eng.execute('''select group_num_annotation from "Recording" order by group_num_annotation asc limit 1''')
    least_annotation = ''
    for r in result:
        least_annotation = int(dict(r)['group_num_annotation'])
    if (least_annotation == 8):
        return render_template('/templates/interface/finish.html')
    else:
        return render_template('/templates/index.html')


@app.route('/annotation_interface', methods=['GET', 'POST'])
def start():
    survey_id = uuid.uuid4()
    entry = Survey(survey_id)
    ses.add(entry)
    ses.commit()
    while (True):
        recording = randrange(8)+1 # get random digit from 0 to 7
        result = eng.execute('''select file_name, group_id from "Recording" where group_id='''+str(recording))
        recordings = '''"recordings":{'''
        index = 0
        group_id = ''
        for r in result:
            recordings = recordings + '"' + str(index) + '":' + '"' + str(dict(r)['file_name']) + '",'
            group_id = str(dict(r)['group_id'])
            index += 1
        recordings = recordings[:len(recordings)-1] + "}"
        group_id = '''"group_id":{"0":"''' + group_id + '"}'
        survey_id = '''"survey_id":{"0":"''' + str(survey_id) + '"}'
        return "{" + survey_id + "," + group_id + "," + recordings + "}"


@app.route('/interaction', methods=['GET', 'POST'])
def interaction():
    if request.method == 'POST':
        data = request.json
        survey_id = data['survey_id']
        action_type = data['action_type']
        value = data['value']
        timestamp = datetime.fromtimestamp(data['timestamp'] / 1000)
        entry = Interaction(survey_id,action_type,value,timestamp)
        ses.add(entry)
        ses.commit()
    return 'success'


@app.route('/next', methods=['GET', 'POST'])
def next():
    if request.method == 'POST':
        data = request.json
        survey_id = data['survey_id']
        file_name = data['file_name']
        user_note = data['user_note']

        result_recording_id = eng.execute('''select recording_id from "Recording" where file_name = '''+ "'" + file_name + "'")
        for r in result_recording_id:
            recording_id = dict(r)['recording_id']

        # update number of annotation in Recording table
        eng.execute('''update "Recording" set user_num_annotation = user_num_annotation + 1 where recording_id = '''+ str(recording_id))

        # insert into Interaction table
        timestamp= datetime.fromtimestamp(data['timestamp'] / 1000)
        entry = Interaction(survey_id,"submit",None,timestamp)
        ses.add(entry)
        ses.commit()

        # insert into Annotation table
        entry1 = Annotation(survey_id,recording_id,user_note)
        ses.add(entry1)
        ses.commit()

        # insert into Location table
        azimuth = data['curr_azimuth']
        elevation = data['curr_elevation']
        entry2 = Location(survey_id,azimuth,elevation)
        ses.add(entry2)
        ses.commit()

        result = eng.execute('''select id from "Annotation" where survey_id = ''' + "'" + survey_id + "'")
        for r in result:
            annotation_id = str(dict(r)['id'])
        
        eng.execute('''update "Interaction" set annotation_id='''+annotation_id+'''where annotation_id = '''  + "'" + survey_id + "'")
        eng.execute('''update "Location" set annotation_id='''+annotation_id+'''where annotation_id = '''  + "'" + survey_id + "'")

    return 'success'


if __name__ =='__main__':
    app.run(debug=True)