function setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('tanggal').value = `${yyyy}-${mm}-${dd}`;
}

function hitungLogika(masuk, keluar) {
    const t1 = new Date(`2026-01-01 ${masuk}`);
    const t2 = new Date(`2026-01-01 ${keluar}`);
    let diff = (t2 - t1) / (1000 * 60);
    if (diff < 0) diff += 1440;
    const mPokok = Math.min(diff, 600);
    const mLembur = Math.max(0, diff - 600);
    return { 
        menit_pokok: mPokok, 
        menit_lembur: mLembur, 
        gaji_pokok: mPokok * 125, 
        gaji_lembur: mLembur * 100, 
        total_harian: (mPokok * 125) + (mLembur * 100) 
    };
}

async function tambahData() {
    const nm = document.getElementById("nama").value.toUpperCase().trim();
    const tgl = document.getElementById("tanggal").value;
    const msk = document.getElementById("masuk").value;
    const klr = document.getElementById("keluar").value;

    if(!nm || !tgl || !msk || !klr) {
        return Swal.fire("Opps!", "Lengkapi semua data!", "warning");
    }

    const payload = { 
        nama: nm, 
        tanggal: tgl, 
        masuk: msk, 
        keluar: klr, 
        ...hitungLogika(msk, klr) 
    };

    const res = await fetch('/api/gaji', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    if(res.ok) {
        Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false });
        document.getElementById("nama").value = "";
        muatData();
    }
}

async function muatData() {
    const res = await fetch('/api/gaji');
    const data = await res.json();
    const kelompok = {};

    data.forEach(item => {
        if (!kelompok[item.nama]) {
            kelompok[item.nama] = {
                records: [],
                total_pokok: 0,
                total_lembur: 0,
                total_harian: 0,
                bonus: item.bonus,
                kasbon: item.kasbon
            };
        }
        kelompok[item.nama].records.push(item);
        kelompok[item.nama].total_pokok += item.gaji_pokok;
        kelompok[item.nama].total_lembur += item.gaji_lembur;
        kelompok[item.nama].total_harian += item.total_harian;
    });

    let html = "";
    for (const nama in kelompok) {
        const k = kelompok[nama];
        const sisaGaji = k.total_harian + k.bonus - k.kasbon;

        html += `
        <div class="rekap-card">
            <table class="table-main">
                <thead>
                    <tr>
                        <th>NAMA</th><th>TANGGAL</th><th>JAM KERJA</th><th>MENIT POKOK</th>
                        <th>MENIT LEMBUR</th><th>GAJI POKOK</th><th>GAJI LEMBUR</th><th>TOTAL HARIAN</th><th>AKSI</th>
                    </tr>
                </thead>
                <tbody>`;

        k.records.forEach((row, index) => {
            const totalMnt = row.menit_pokok + row.menit_lembur;
            const jam = Math.floor(totalMnt / 60);
            const mnt = totalMnt % 60;
            const displayJam = `${jam}JAM ${mnt > 0 ? mnt + 'M' : ''}`;

            html += `
                <tr>
                    ${index === 0 ? `<td rowspan="${k.records.length}" class="merge-name">${nama}</td>` : ''}
                    <td>${row.tanggal}</td>
                    <td>${displayJam}</td>
                    <td>${row.menit_pokok}</td>
                    <td>${row.menit_lembur || ''}</td>
                    <td>Rp ${row.gaji_pokok.toLocaleString()}</td>
                    <td>Rp ${row.gaji_lembur.toLocaleString()}</td>
                    <td style="font-weight:bold;">Rp ${row.total_harian.toLocaleString()}</td>
                    <td><button onclick="hapusData(${row.id})" class="btn-del">✖</button></td>
                </tr>`;
        });

        html += `
                </tbody>
            </table>
            <div class="footer-box">
                <table class="table-sub">
                    <tr><td>GAJI POKOK</td><td>Rp ${k.total_pokok.toLocaleString()}</td></tr>
                    <tr><td>GAJI LEMBUR</td><td>Rp ${k.total_lembur.toLocaleString()}</td></tr>
                    <tr>
                        <td>BONUS</td>
                        <td><input type="number" value="${k.bonus}" onchange="updateTambahan('${nama}', this.value, ${k.kasbon})"></td>
                    </tr>
                    <tr>
                        <td>CASH BON</td>
                        <td><input type="number" value="${k.kasbon}" onchange="updateTambahan('${nama}', ${k.bonus}, this.value)"></td>
                    </tr>
                    <tr class="final-row">
                        <td>SISA GAJI</td>
                        <td>Rp ${sisaGaji.toLocaleString()} <span class="status-lunas">LUNAS</span></td>
                    </tr>
                </table>
            </div>
        </div>`;
    }
    document.getElementById("tabel-container").innerHTML = html || '<p style="text-align:center; padding:20px; color:#999;">Belum ada data.</p>';
}

async function updateTambahan(nama, bonus, kasbon) {
    await fetch('/api/gaji/update_tambahan', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nama: nama, bonus: parseInt(bonus) || 0, kasbon: parseInt(kasbon) || 0 })
    });
    muatData();
}

async function hapusData(id) {
    const res = await Swal.fire({ title: 'Hapus data ini?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
    if(res.isConfirmed) {
        await fetch(`/api/gaji/${id}`, { method: 'DELETE' });
        muatData();
    }
}

window.onload = () => {
    setTodayDate();
    muatData();
};