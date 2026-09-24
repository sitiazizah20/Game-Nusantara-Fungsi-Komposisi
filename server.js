import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// In-memory student leaderboard data
let studentScores = [
  {
    id: 'score-1',
    nama: 'Budi Santoso',
    kelas: 'XI MIPA 1',
    skor: 100,
    waktuDetik: 95,
    tanggal: new Date(Date.now() - 3600000 * 2).toISOString(),
    detail: { benar: 5, total: 5 }
  },
  {
    id: 'score-2',
    nama: 'Annisa Rahmawati',
    kelas: 'XI MIPA 2',
    skor: 100,
    waktuDetik: 124,
    tanggal: new Date(Date.now() - 3600000 * 3).toISOString(),
    detail: { benar: 5, total: 5 }
  },
  {
    id: 'score-3',
    nama: 'Rian Pratama',
    kelas: 'XI MIPA 1',
    skor: 80,
    waktuDetik: 88,
    tanggal: new Date(Date.now() - 3600000 * 4).toISOString(),
    detail: { benar: 4, total: 5 }
  },
  {
    id: 'score-4',
    nama: 'Siti Fauziyah',
    kelas: 'XI MIPA 3',
    skor: 80,
    waktuDetik: 110,
    tanggal: new Date(Date.now() - 3600000 * 5).toISOString(),
    detail: { benar: 4, total: 5 }
  },
  {
    id: 'score-5',
    nama: 'Dedi Kurniawan',
    kelas: 'XI MIPA 2',
    skor: 60,
    waktuDetik: 140,
    tanggal: new Date(Date.now() - 3600000 * 6).toISOString(),
    detail: { benar: 3, total: 5 }
  }
];

// Helper to sort scores: Score DESC (terbesar), Waktu ASC (tercepat), Tanggal ASC
function getSortedScores() {
  return [...studentScores].sort((a, b) => {
    if (b.skor !== a.skor) {
      return b.skor - a.skor; // Nilai terbesar di atas
    }
    return a.waktuDetik - b.waktuDetik; // Waktu tercepat di atas
  });
}

// GET all scores sorted
app.get('/api/scores', (req, res) => {
  const sorted = getSortedScores();
  res.json({ success: true, data: sorted });
});

// POST a new score
app.post('/api/scores', (req, res) => {
  const { nama, kelas, skor, waktuDetik, detail } = req.body;
  if (!nama) {
    return res.status(400).json({ success: false, message: 'Nama siswa wajib diisi' });
  }

  const newEntry = {
    id: 'score-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    nama: String(nama).trim().substring(0, 50),
    kelas: (kelas || 'XI Umum').trim().substring(0, 30),
    skor: typeof skor === 'number' ? skor : 0,
    waktuDetik: typeof waktuDetik === 'number' ? waktuDetik : 0,
    tanggal: new Date().toISOString(),
    detail: detail || {}
  };

  studentScores.push(newEntry);
  const sorted = getSortedScores();
  const rank = sorted.findIndex(s => s.id === newEntry.id) + 1;

  res.json({ success: true, entry: newEntry, rank, total: sorted.length });
});

// DELETE reset scores (for teacher admin)
app.delete('/api/scores', (req, res) => {
  studentScores = [];
  res.json({ success: true, message: 'Data penskoran berhasil direset' });
});

// CSV Export for teacher
app.get('/api/scores/export', (req, res) => {
  const sorted = getSortedScores();
  let csv = 'Peringkat,Nama Siswa,Kelas,Nilai,Waktu (Detik),Format Waktu,Tanggal\n';
  sorted.forEach((item, index) => {
    const mins = Math.floor(item.waktuDetik / 60);
    const secs = item.waktuDetik % 60;
    const timeFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    const cleanNama = `"${(item.nama || '').replace(/"/g, '""')}"`;
    const cleanKelas = `"${(item.kelas || '').replace(/"/g, '""')}"`;
    const dateFormatted = new Date(item.tanggal).toLocaleString('id-ID');
    csv += `${index + 1},${cleanNama},${cleanKelas},${item.skor},${item.waktuDetik},"${timeFormatted}","${dateFormatted}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Peringkat_Penskoran_Siswa.csv"');
  res.send(csv);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
