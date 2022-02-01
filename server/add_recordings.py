import os
import pickle

from server.db_tables import ses, Recording, RecordingGroup
from server.main import app

if __name__ == "__main__":
	ROOT, DIRS, FILES = 0, 1, 2
	root = os.path.join(app.static_folder, 'audio')
	config_path = os.path.join(root, 'test_selected_all.pickle')
	with open(config_path, 'rb') as file:
		filedata = pickle.load(file)
		config = {t[1]: t[2] for t in filedata}
	print("creating entries from", root)
	folders = next(os.walk(root))[DIRS]
	for folder in folders:
		if folder == 'jackhammer_only' or folder == 'practice':
			continue
		print('---', folder)
		rg = RecordingGroup(folder=folder)
		ses.add(rg)
		files = next(os.walk(os.path.join(root, folder)))[FILES]
		for file in files:
			print(file)
			ses.add(Recording(group=rg, file_name=file, label='jackhammer', presence=config[file]))
	ses.commit()
