from flask import Flask, render_template, request, jsonify
import mysql.connector

app = Flask(__name__)

# Konfigurasi Database
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'db_bakery'
}

def get_db():
    return mysql.connector.connect(**db_config)

@app.route('/')
def index():
    return render_template('index.html')

# API: Ambil & Tambah Data
@app.route('/api/gaji', methods=['GET', 'POST'])
def handle_gaji():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'POST':
        data = request.json
        try:
            # Setiap input baru disimpan sebagai baris baru agar rincian terjaga
            query = """INSERT INTO karyawan (nama, tanggal, masuk, keluar, menit_pokok, menit_lembur, gaji_pokok, gaji_lembur, total_harian) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(query, (data['nama'], data['tanggal'], data['masuk'], data['keluar'], 
                                   data['menit_pokok'], data['menit_lembur'], data['gaji_pokok'], 
                                   data['gaji_lembur'], data['total_harian']))
            conn.commit()
            return jsonify({"status": "success"}), 201
        finally:
            conn.close()
    else:
        # Mengambil semua data diurutkan berdasarkan nama agar mudah dikelompokkan
        cursor.execute("""SELECT id, nama, CAST(tanggal AS CHAR) as tanggal, menit_pokok, menit_lembur, 
                       gaji_pokok, gaji_lembur, total_harian, bonus, kasbon FROM karyawan ORDER BY nama ASC, tanggal DESC""")
        rows = cursor.fetchall()
        conn.close()
        return jsonify(rows)

# API: Update Bonus/Kasbon (Berdasarkan Nama)
@app.route('/api/gaji/update_tambahan', methods=['PUT'])
def update_tambahan():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Jika Bonus/Kasbon diubah untuk satu orang, maka semua baris milik orang tersebut akan terupdate
        query = "UPDATE karyawan SET bonus = %s, kasbon = %s WHERE nama = %s"
        cursor.execute(query, (data['bonus'], data['kasbon'], data['nama']))
        conn.commit()
        return jsonify({"status": "updated"}), 200
    finally:
        conn.close()

# API: Hapus Baris
@app.route('/api/gaji/<int:id>', methods=['DELETE'])
def delete_gaji(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM karyawan WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "deleted"})

if __name__ == '__main__':
    app.run(debug=True)