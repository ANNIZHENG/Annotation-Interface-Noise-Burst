-- in postgresql do \i path/to/this/file

CREATE TABLE "Recording" (
	id serial PRIMARY KEY,
	recording_name VARCHAR,
	file_name VARCHAR,
	num_annotation INTEGER,
	actual_num_source INTEGER
);

CREATE TABLE "Recording_Joint_Source" (
	recording_id INTEGER,
	source_id INTEGER,
	azimuth INTEGER,
	elevation INTEGER
);

CREATE TABLE "Source" (
	id serial PRIMARY KEY,
	file_name VARCHAR,
	coarse_class VARCHAR,
	specific_class VARCHAR
);

-- PLEASE CHANGE THE PATH TO ACCOMODATE YOUR ENVIRONMENT!

COPY "Recording"(recording_name, file_name, num_annotation, actual_num_source)
FROM '/Users/anniezheng/Desktop/Annotation-Interface-Noise-Burst/database/recording.csv'
DELIMITER ','
CSV HEADER;

COPY "Recording_Joint_Source"(recording_id, source_id, azimuth, elevation)
FROM '/Users/anniezheng/Desktop/Annotation-Interface-Noise-Burst/database/recording_joint_source.csv'
DELIMITER ','
CSV HEADER;

COPY "Source"(file_name, coarse_class, specific_class)
FROM '/Users/anniezheng/Desktop/Annotation-Interface-Noise-Burst/database/source.csv'
DELIMITER ','
CSV HEADER;