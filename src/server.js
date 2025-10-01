const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- API: Membros (com endereço) ---
app.get('/api/membros', (req, res) => {
  db.all('SELECT * FROM membros', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/membros', (req, res) => {
  const { nome, cargo, estado_civil, batismo, contato, endereco } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  db.run(
    `INSERT INTO membros (nome, cargo, estado_civil, batismo, contato, endereco) VALUES (?, ?, ?, ?, ?, ?)`,
    [nome, cargo || 'Membro', estado_civil || 'Solteiro(a)', batismo || '', contato || '', endereco || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, nome, cargo, estado_civil, batismo, contato, endereco });
    }
  );
});

// --- API: Igrejas ---
app.get('/api/igrejas', (req, res) => {
  db.all('SELECT * FROM igrejas', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/igrejas', (req, res) => {
  const { nome, tipo, localizacao, responsavel, contato } = req.body;
  db.run(
    `INSERT INTO igrejas (nome, tipo, localizacao, responsavel, contato) VALUES (?, ?, ?, ?, ?)`,
    [nome || '', tipo || 'Sede', localizacao || '', responsavel || '', contato || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// --- API: Pastores ---
app.get('/api/pastores', (req, res) => {
  db.all(`SELECT p.id, p.nome, p.contato, i.nome as igreja 
          FROM pastores p 
          LEFT JOIN igrejas i ON p.igreja_id = i.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/pastores', (req, res) => {
  const { nome, contato, igreja_id } = req.body;
  db.run(
    `INSERT INTO pastores (nome, contato, igreja_id) VALUES (?, ?, ?)`,
    [nome || '', contato || '', igreja_id || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// --- API: Finanças ---
app.get('/api/financa', (req, res) => {
  db.all('SELECT * FROM financa', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/financa', (req, res) => {
  const { data, tipo, categoria, valor, observacoes } = req.body;
  db.run(
    `INSERT INTO financa (data, tipo, categoria, valor, observacoes) VALUES (?, ?, ?, ?, ?)`,
    [data || '', tipo || 'Receita', categoria || 'Outras', parseFloat(valor) || 0, observacoes || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// --- API: Atividades ---
app.get('/api/atividades', (req, res) => {
  db.all('SELECT * FROM atividades', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/atividades', (req, res) => {
  const { data, horario, atividade, local, responsavel } = req.body;
  db.run(
    `INSERT INTO atividades (data, horario, atividade, local, responsavel) VALUES (?, ?, ?, ?, ?)`,
    [data || '', horario || '', atividade || '', local || '', responsavel || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/atividades/:id', (req, res) => {
  db.run(`DELETE FROM atividades WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Excluído' });
  });
});

// --- RELATÓRIOS ---
app.get('/api/relatorios/fluxo-caixa', (req, res) => {
  db.all(`SELECT 
    SUM(CASE WHEN tipo = 'Receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'Despesa' THEN valor ELSE 0 END) as total_despesas
    FROM financa`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const total_receitas = rows[0].total_receitas || 0;
    const total_despesas = rows[0].total_despesas || 0;
    res.json({
      receitas: parseFloat(total_receitas.toFixed(2)),
      despesas: parseFloat(total_despesas.toFixed(2)),
      saldo: parseFloat((total_receitas - total_despesas).toFixed(2))
    });
  });
});

app.get('/api/relatorios/receitas', (req, res) => {
  db.all(`SELECT categoria, SUM(valor) as total 
          FROM financa 
          WHERE tipo = 'Receita' 
          GROUP BY categoria
          ORDER BY total DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, total: parseFloat(r.total.toFixed(2)) })));
  });
});

app.get('/api/relatorios/despesas', (req, res) => {
  db.all(`SELECT categoria, SUM(valor) as total 
          FROM financa 
          WHERE tipo = 'Despesa' 
          GROUP BY categoria
          ORDER BY total DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, total: parseFloat(r.total.toFixed(2)) })));
  });
});

// --- DASHBOARD (dados reais) ---
app.get('/api/dashboard', (req, res) => {
  db.all(`SELECT 
    (SELECT COUNT(*) FROM membros) as total_membros,
    (SELECT COUNT(*) FROM pastores) as total_pastores,
    (SELECT COUNT(*) FROM igrejas) as total_igrejas,
    (SELECT COUNT(*) FROM atividades) as total_atividades,
    (SELECT SUM(CASE WHEN tipo = 'Receita' THEN valor ELSE 0 END) FROM financa) as receitas,
    (SELECT SUM(CASE WHEN tipo = 'Despesa' THEN valor ELSE 0 END) FROM financa) as despesas
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const data = rows[0];
    res.json({
      membros: data.total_membros || 0,
      pastores: data.total_pastores || 0,
      igrejas: data.total_igrejas || 0,
      atividades: data.total_atividades || 0,
      receitas: parseFloat((data.receitas || 0).toFixed(2)),
      despesas: parseFloat((data.despesas || 0).toFixed(2)),
      saldo: parseFloat(((data.receitas || 0) - (data.despesas || 0)).toFixed(2))
    });
  });
});

// Servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Sistema rodando em http://localhost:${PORT}`);
});