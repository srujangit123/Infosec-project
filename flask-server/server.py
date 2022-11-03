from flask import Flask, request, Response
from flaskext.mysql import MySQL


app = Flask(__name__)
mysql = MySQL()

app.config['MYSQL_DATABASE_USER'] = 'infosec'
app.config['MYSQL_DATABASE_PASSWORD'] = 'infosec123'
app.config['MYSQL_DATABASE_DB'] = 'iotData'
app.config['MYSQL_DATABASE_HOST'] = 'localhost'

mysql.init_app(app)


@app.route('/')
def home():
    args = request.args
    print (args)
    deviceId = args['deviceId']
    locationId = args['locationId']
    conn = mysql.connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices_locations where device_id = %s and location_id = %s", (deviceId, locationId))
    row = cursor.fetchone()
    if row:
        return Response("{'message': 'Authorized'}", status=200, mimetype='application/json')
    else:
        return Response("{'message': 'Unauthorized'}", status=401, mimetype='application/json')


if __name__ == '__main__':
    app.run(debug=True)