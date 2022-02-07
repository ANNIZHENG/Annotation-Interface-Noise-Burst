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

    survey_id = '''"survey_id":{"0":"''' + str(survey_id) + '"}'

    data = request.json
    practice = bool(int(data['practice']))

    while (True):
        recording = randrange(8) + 1 # get random digit from 1 to 8, which is group id
        recording_practice = 0
        if (practice):
            if (recording == 8):
                recording_practice = 1
            elif (recording == 7):
                recording_practice = 2
            elif (recording == 6):
                recording_practice = 3
            elif (recording == 5):
                recording_practice = 4
            elif (recording == 4):
                recording_practice = 5
            elif (recording == 3):
                recording_practice = 6
            elif (recording == 2):
                recording_practice = 7
            elif (recording == 1):
                recording_practice = 8

        result = eng.execute('''select group_num_annotation from "Recording" where group_id = '''+str(recording))

        for r in result:
            group_num_annotation = int(dict(r)['group_num_annotation'])
            if (group_num_annotation == 8):
                break
            else:
                result = eng.execute('''select file_name from "Recording" where group_id = '''+str(recording))
                recordings = '''"recordings":{'''
                index = 0
                group_id = ''
                for r in result:
                    recordings = recordings + '"' + str(index) + '":' + '"' + str(dict(r)['file_name']) + '",'
                    index += 1
                recordings = recordings[:len(recordings)-1] + "}"
                group_id = '''"group_id":{"0":"''' + str(recording) + '"}'


                result = eng.execute('''select file_name from "Recording" where group_id = '''+str(recording_practice))
                recordings_practice = '''"recordings_practice":{'''
                index = 0
                group_id_practice = ''
                for r in result:
                    recordings_practice = recordings_practice + '"' + str(index) + '":' + '"' + str(dict(r)['file_name']) + '",'
                    index += 1
                recordings_practice = recordings_practice[:len(recordings_practice)-1] + "}"
                group_id_practice = '''"group_id_practice":{"0":"''' + str(recording_practice) + '"}'

                return "{" + survey_id + "," + group_id + "," + recordings + "," + group_id_practice + "," + recordings_practice + "}"


@app.route('/interaction', methods=['GET', 'POST'])
def interaction():
    if request.method == 'POST':
        data = request.json

        action_type = data['action_type']
        value = data['value']
        survey_id = data['survey_id']
        timestamp = datetime.fromtimestamp(data['timestamp'] / 1000)
        practice = bool(int(data['practice']))

        entry = Interaction(survey_id,action_type,value,timestamp,practice)
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
        azimuth = data['curr_azimuth']
        elevation = data['curr_elevation']
        practice = bool(int(data['practice']))
        end = bool(int(data['end']))
        group_id = data['group_id']

        result_recording_id = eng.execute('''select recording_id from "Recording" where file_name = ''' + "'" + file_name + "'")
        for r in result_recording_id:
            recording_id = dict(r)['recording_id']

        timestamp= datetime.fromtimestamp(data['timestamp'] / 1000)
        entry = Interaction(survey_id,"submit",None,timestamp,practice)
        ses.add(entry)
        ses.commit()

        entry1 = Annotation(survey_id,recording_id,user_note,practice)
        ses.add(entry1)
        ses.commit()

        entry2 = Location(survey_id,azimuth,elevation,practice)
        ses.add(entry2)
        ses.commit()

        result = eng.execute('''select id from "Annotation" where survey_id = ''' + "'" + survey_id + "' order by id desc limit 1")
        for r in result:
            annotation_id = str(dict(r)['id'])
        eng.execute('''update "Interaction" set annotation_id = ''' + "'" + annotation_id + "'" + ''' where annotation_id = '''  + "'" + survey_id + "'")
        eng.execute('''update "Location" set annotation_id = ''' + "'" +annotation_id + "'" +''' where annotation_id = '''  + "'" + survey_id + "'")

        if (end):
            eng.execute('''update "Recording" set group_num_annotation = group_num_annotation + 1 where group_id = ''' + str(group_id))
            eng.execute('''update "Recording" set user_num_annotation = user_num_annotation + 4 where group_id = ''' + str(group_id))

    return 'success'


if __name__ =='__main__':
    app.run(debug=True)