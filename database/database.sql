CREATE TABLE "Recording" (
	id serial PRIMARY KEY,
	recording_name VARCHAR,
	file_name VARCHAR,
	num_annotation INTEGER,
	group_id INTEGER
);


COPY "Recording"(recording_name, file_name, num_annotation, group_id)
FROM '/Users/anniezheng/Desktop/Annotation-Interface-Noise-Burst/database/recording.csv'
DELIMITER ','
CSV HEADER;