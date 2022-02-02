from sqlalchemy import *
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

db_path = 'postgresql://llmchqfhvdwpop:8f6b6899b24221c36bc979822c407c31bd099e3259c5d4f6682d63d993276d3f@ec2-34-230-167-186.compute-1.amazonaws.com:5432/dcoppvn70vslf9'

eng = create_engine(db_path)
Base = declarative_base()

class Survey(Base):
    __tablename__ = "Survey"
    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column(String)
    def __init__(self,survey_id):
        self.survey_id = survey_id


class Annotation(Base):
    __tablename__ = "Annotation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column(String)
    recording_id = Column(Integer)
    user_note = Column(String)

    def __init__(self,survey_id,recording_id,user_note):
        self.survey_id = survey_id
        self.recording_id = recording_id
        self.user_note = user_note


class Interaction(Base):
    __tablename__ = "Interaction"

    id = Column(Integer, primary_key=True, autoincrement=True)
    annotation_id = Column(String)
    action_type = Column(String)
    value = Column(String)
    timestamp = Column(TIMESTAMP)

    def __init__(self,annotation_id,action_type,value,timestamp):
        self.annotation_id = annotation_id
        self.action_type = action_type
        self.value = value
        self.timestamp = timestamp


class Location(Base):
    __tablename__ = "Location"

    id = Column(Integer, primary_key=True, autoincrement=True)
    annotation_id = Column(String)
    azimuth = Column(Integer)
    elevation = Column(Integer)

    def __init__(self,annotation_id,azimuth,elevation):
        self.annotation_id = annotation_id
        self.azimuth = azimuth
        self.elevation = elevation


Base.metadata.bind = eng
Session = sessionmaker(bind=eng)
ses = Session()

Base.metadata.bind = eng
Session = sessionmaker(bind=eng)
ses = Session()

Base.metadata.create_all()
