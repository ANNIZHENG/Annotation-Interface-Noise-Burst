CREATE TABLE "Recording" (
	file_name VARCHAR,
	recording_id INTEGER PRIMARY KEY,
	group_id INTEGER,
	user_num_annotation INTEGER,
	group_num_annotation INTEGER
);


COPY "Recording"(file_name, recording_id, group_id, user_num_annotation, group_num_annotation)
FROM '/Users/anniezheng/Desktop/Annotation-Interface-Noise-Burst/database/gaussian_groups.csv'
DELIMITER ','
CSV HEADER;