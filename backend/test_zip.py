import requests, io, zipfile
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w') as z:
    z.writestr('test.txt', 'hello')
files = {'file': ('test.zip', buf.getvalue(), 'application/zip')}
data = {'profile_name': 'welding test'}
res = requests.post('http://localhost:8000/dataset/upload_zip', files=files, data=data)
print("STATUS:", res.status_code)
print("TEXT:", res.text)
