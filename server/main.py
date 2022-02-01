from operator import methodcaller
import uuid
from sqlalchemy import *
from sqlalchemy.sql import *
from datetime import datetime
from flask import *
from db_tables import ses,eng,Annotation,Survey,Location,Interaction
from random import randrange
app = Flask(__name__,static_folder="../templates",template_folder="..")

# server side ajaxes
@app.route('/')
def home():
    return render_template('/templates/index.html')


@app.route('/annotation_interface', methods=['GET', 'POST'])
def start():
    survey_id = uuid.uuid4()
    entry = Survey(survey_id)
    ses.add(entry)
    ses.commit()
    return str(survey_id)


@app.route('/interaction', methods=['GET', 'POST'])
def interaction():
    if request.method == 'POST':
        data = request.json
        action_type = data['action_type']
        value = data['value']
        survey_id = data['survey_id']
        timestamp= datetime.fromtimestamp(data['timestamp'] / 1000)
        entry = Interaction(survey_id,action_type,value,timestamp,False)
        ses.add(entry)
        ses.commit()
    return 'success'


@app.route('/next', methods=['GET', 'POST'])
def next():
    if request.method == 'POST':
        data = request.json

        survey_id = data['survey_id']
        recording_id = int(data['curr_recording']) + 1
        user_note = data['user_note']

        # insert into Interaction table
        timestamp= datetime.fromtimestamp(data['timestamp'] / 1000)
        entry = Interaction(survey_id,"submit",None,timestamp,False)
        ses.add(entry)
        ses.commit()

        # insert into Annotation table
        entry1 = Annotation(survey_id,recording_id,user_note,False)
        ses.add(entry1)
        ses.commit()

        azimuth = data['curr_azimuth']
        elevation = data['curr_elevation']
        entry2 = Location(survey_id,azimuth,elevation,False)
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