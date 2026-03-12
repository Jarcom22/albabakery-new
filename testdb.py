import mysql.connector

# GANTI DENGAN DATA DARI AIVEN KAMU
db_config = {
    'host': 'mysql-758ced3-albabakery.f.aivencloud.com',
    'port': 21784,
    'user': 'avnadmin',
    'password': 'AVNS_ymjHUAVNMAFb5RMKRDC',
    'database': 'defaultdb'
}

def create_table():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        query = """
        CREATE TABLE IF NOT EXISTS karyawan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100),
            tanggal DATE,
            masuk TIME,
            keluar TIME,
            menit_pokok INT,
            menit_lembur INT,
            gaji_pokok INT,
            gaji_lembur INT,
            total_harian INT,
            bonus INT DEFAULT 0,
            kasbon INT DEFAULT 0
        );
        """
        cursor.execute(query)
        print("MANTAP! Tabel 'karyawan' sudah berhasil dibuat di Aiven Cloud.")
        conn.close()
    except Exception as e:
        print(f"Gagal konek: {e}")

if __name__ == "__main__":
    create_table()