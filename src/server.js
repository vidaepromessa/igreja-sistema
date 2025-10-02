const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Função para criar tabelas
async function criarTabelas() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS membros (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cargo TEXT,
      estado_civil TEXT,
      batismo TEXT,
      contato TEXT,
      endereco TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS igrejas (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT,
      localizacao TEXT,
      responsavel TEXT,
      contato TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pastores (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      contato TEXT,
      igreja_id INTEGER REFERENCES igrejas(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financa (
      id SERIAL PRIMARY KEY,
      data TEXT,
      tipo TEXT,
      categoria TEXT,
      valor NUMERIC,
      observacoes TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS atividades (
      id SERIAL PRIMARY KEY,
      data TEXT,
      horario TEXT,
      atividade TEXT,
      local TEXT,
      responsavel TEXT
    )
  `);
}

// Criar tabelas ao iniciar
criarTabelas().catch(console.error);

// --- API: Finanças ---
app.get('/api/financa', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financa');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em /api/financa:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/financa', async (req, res) => {
  const { data, tipo, categoria, valor, observacoes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO financa (data, tipo, categoria, valor, observacoes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data || '', tipo || 'Receita', categoria || 'Outras', parseFloat(valor) || 0, observacoes || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar finança:', err);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// --- API: Membros ---
app.get('/api/membros', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM membros');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em /api/membros:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/membros', async (req, res) => {
  const { nome, cargo, estado_civil, batismo, contato, endereco } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO membros (nome, cargo, estado_civil, batismo, contato, endereco) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, cargo || 'Membro', estado_civil || 'Solteiro(a)', batismo || '', contato || '', endereco || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar membro:', err);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// --- API: Igrejas ---
app.get('/api/igrejas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM igrejas');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em /api/igrejas:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/igrejas', async (req, res) => {
  const { nome, tipo, localizacao, responsavel, contato } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO igrejas (nome, tipo, localizacao, responsavel, contato) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome || '', tipo || 'Sede', localizacao || '', responsavel || '', contato || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar igreja:', err);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// --- API: Pastores ---
app.get('/api/pastores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nome, p.contato, i.nome as igreja 
      FROM pastores p 
      LEFT JOIN igrejas i ON p.igreja_id = i.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em /api/pastores:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/pastores', async (req, res) => {
  const { nome, contato, igreja_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pastores (nome, contato, igreja_id) 
       VALUES ($1, $2, $3) RETURNING *`,
      [nome || '', contato || '', igreja_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar pastor:', err);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// --- API: Atividades ---
app.get('/api/atividades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM atividades');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro em /api/atividades:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/atividades', async (req, res) => {
  const { data, horario, atividade, local, responsavel } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO atividades (data, horario, atividade, local, responsavel) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data || '', horario || '', atividade || '', local || '', responsavel || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar atividade:', err);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

app.delete('/api/atividades/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM atividades WHERE id = $1', [req.params.id]);
    res.json({ message: 'Excluído' });
  } catch (err) {
    console.error('Erro ao excluir atividade:', err);
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

// --- RELATÓRIOS ---
app.get('/api/relatorios/fluxo-caixa', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'Receita' THEN valor END), 0) as total_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'Despesa' THEN valor END), 0) as total_despesas
      FROM financa
    `);
    const row = result.rows[0];
    res.json({
      receitas: parseFloat(row.total_receitas || 0),
      despesas: parseFloat(row.total_despesas || 0),
      saldo: parseFloat((row.total_receitas || 0) - (row.total_despesas || 0))
    });
  } catch (err) {
    console.error('Erro em /api/relatorios/fluxo-caixa:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.get('/api/relatorios/receitas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT categoria, SUM(valor) as total 
      FROM financa 
      WHERE tipo = 'Receita' 
      GROUP BY categoria
      ORDER BY total DESC
    `);
    res.json(result.rows.map(r => ({ 
      ...r, 
      total: parseFloat(r.total || 0) 
    })));
  } catch (err) {
    console.error('Erro em /api/relatorios/receitas:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.get('/api/relatorios/despesas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT categoria, SUM(valor) as total 
      FROM financa 
      WHERE tipo = 'Despesa' 
      GROUP BY categoria
      ORDER BY total DESC
    `);
    res.json(result.rows.map(r => ({ 
      ...r, 
      total: parseFloat(r.total || 0) 
    })));
  } catch (err) {
    console.error('Erro em /api/relatorios/despesas:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard', async (req, res) => {
  try {
    const [membros, pastores, igrejas, atividades, financa] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM membros'),
      pool.query('SELECT COUNT(*) as total FROM pastores'),
      pool.query('SELECT COUNT(*) as total FROM igrejas'),
      pool.query('SELECT COUNT(*) as total FROM atividades'),
      pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'Receita' THEN valor END), 0) as receitas,
          COALESCE(SUM(CASE WHEN tipo = 'Despesa' THEN valor END), 0) as despesas
        FROM financa
      `)
    ]);

    res.json({
      membros: parseInt(membros.rows[0].total || 