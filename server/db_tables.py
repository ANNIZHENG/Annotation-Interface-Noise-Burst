from sqlalchemy import *
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# db_path = 'postgresql://llmchqfhvdwpop:8f6b6899b24221c36bc979822c407c31bd099e3259c5d4f6682d63d993276d3f@ec2-34-230-167-186.compute-1.amazonaws.com:5432/dcoppvn70vslf9'
db_path = 'postgresql://pwoaklebhndrfv:f706b27914474556bdf8a647270a0169bedad42f4df75194e949709d5b283953@ec2-50-19-32-96.compute-1.amazonaws.com:5432/d4m9cqbfljjaus'

eng = create_engine(db_path)
Base = declarative_base()

class Survey(Base):
    __tablename__ = "Survey"
    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column(String)
    approved = Column(Boolean)
    completed = Column(Boolean)
    recording_group_id = Column(Integer)
    
    def __init__(self,survey_id):
        self.survey_id = survey_id


class Annotation(Base):
    __tablename__ = "Annotation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column(String)
    recording_id = Column(Integer)
    user_note = Column(String)
    practice_round = Column(Boolean)

    def __init__(self,survey_id,recording_id,user_note,practice_round):
        self.survey_id = survey_id
        self.recording_id = recording_id
        self.user_note = user_note
        self.practice_round = practice_round


class Interaction(Base):
    __tablename__ = "Interaction"

    id = Column(Integer, primary_key=True, autoincrement=True)
    annotation_id = Column(String)
    action_type = Column(String)
    value = Column(String)
    timestamp = Column(TIMESTAMP)
    practice_round = Column(Boolean)

    def __init__(self,annotation_id,action_type,value,timestamp,practice_round):
        self.annotation_id = annotation_id
        self.action_type = action_type
        self.value = value
        self.timestamp = timestamp
        self.practice_round = practice_round


class Location(Base):
    __tablename__ = "Location"

    id = Column(Integer, primary_key=True, autoincrement=True)
    annotation_id = Column(String)
    azimuth = Column(Integer)
    elevation = Column(Integer)
    practice_round = Column(Boolean)

    def __init__(self,annotation_id,azimuth,elevation,practice_round):
        self.annotation_id = annotation_id
        self.azimuth = azimuth
        self.elevation = elevation
        self.practice_round = practice_round


Base.metadata.bind = eng
Session = sessionmaker(bind=eng)
ses = Session()

Base.metadata.bind = eng
Session = sessionmaker(bind=eng)
ses = Session()

Base.metadata.create_all()
