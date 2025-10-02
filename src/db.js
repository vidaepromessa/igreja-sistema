const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/igreja_db'
});

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

criarTabelas().catch(console.error);

module.exports = {
  query: (text, params) => pool.query(text, params)
};