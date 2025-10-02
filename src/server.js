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

// --- API: Membros ---
app.get('/api/membros', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM membros');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/membros', async (req, res) => {
  const { nome, cargo, estado_civil, batismo, contato, endereco } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const result = await db.query(
      `INSERT INTO membros (nome, cargo, estado_civil, batismo, contato, endereco) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, cargo || 'Membro', estado_civil || 'Solteiro(a)', batismo || '', contato || '', endereco || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Igrejas ---
app.get('/api/igrejas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM igrejas');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/igrejas', async (req, res) => {
  const { nome, tipo, localizacao, responsavel, contato } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO igrejas (nome, tipo, localizacao, responsavel, contato) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome || '', tipo || 'Sede', localizacao || '', responsavel || '', contato || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Pastores ---
app.get('/api/pastores', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.nome, p.contato, i.nome as igreja 
      FROM pastores p 
      LEFT JOIN igrejas i ON p.igreja_id = i.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pastores', async (req, res) => {
  const { nome, contato, igreja_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO pastores (nome, contato, igreja_id) 
       VALUES ($1, $2, $3) RETURNING *`,
      [nome || '', contato || '', igreja_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Finanças ---
app.get('/api/financa', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM financa');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/financa', async (req, res) => {
  const { data, tipo, categoria, valor, observacoes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO financa (data, tipo, categoria, valor, observacoes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data || '', tipo || 'Receita', categoria || 'Outras', parseFloat(valor) || 0, observacoes || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Atividades ---
app.get('/api/atividades', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM atividades');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/atividades', async (req, res) => {
  const { data, horario, atividade, local, responsavel } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO atividades (data, horario, atividade, local, responsavel) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data || '', horario || '', atividade || '', local || '', responsavel || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/atividades/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM atividades WHERE id = $1', [req.params.id]);
    res.json({ message: 'Excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RELATÓRIOS ---
app.get('/api/relatorios/fluxo-caixa', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'Receita' THEN valor END), 0) as total_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'Despesa' THEN valor END), 0) as total_despesas
      FROM financa
    `);
    const row = result.rows[0];
    res.json({
      receitas: parseFloat(row.total_receitas),
      despesas: parseFloat(row.total_despesas),
      saldo: parseFloat(row.total_receitas - row.total_despesas)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/relatorios/receitas', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT categoria, SUM(valor) as total 
      FROM financa 
      WHERE tipo = 'Receita' 
      GROUP BY categoria
      ORDER BY total DESC
    `);
    res.json(result.rows.map(r => ({ ...r, total: parseFloat(r.total) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/relatorios/despesas', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT categoria, SUM(valor) as total 
      FROM financa 
      WHERE tipo = 'Despesa' 
      GROUP BY categoria
      ORDER BY total DESC
    `);
    res.json(result.rows.map(r => ({ ...r, total: parseFloat(r.total) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard', async (req, res) => {
  try {
    const [membros, pastores, igrejas, atividades, financa] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM membros'),
      db.query('SELECT COUNT(*) as total FROM pastores'),
      db.query('SELECT COUNT(*) as total FROM igrejas'),
      db.query('SELECT COUNT(*) as total FROM atividades'),
      db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'Receita' THEN valor END), 0) as receitas,
          COALESCE(SUM(CASE WHEN tipo = 'Despesa' THEN valor END), 0) as despesas
        FROM financa
      `)
    ]);

    const data = {
      membros: parseInt(membros.rows[0].total),
      pastores: parseInt(pastores.rows[0].total),
      igrejas: parseInt(igrejas.rows[0].total),
      atividades: parseInt(atividades.rows[0].total),
      receitas: parseFloat(financa.rows[0].receitas),
      despesas: parseFloat(financa.rows[0].despesas),
      saldo: parseFloat(financa.rows[0].receitas - financa.rows[0].despesas)
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Sistema rodando em http://localhost:${PORT}`);
});