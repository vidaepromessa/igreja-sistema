const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Membros com ENDEREÇO
  db.run(`CREATE TABLE IF NOT EXISTS membros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT,
    estado_civil TEXT,
    batismo TEXT,
    contato TEXT,
    endereco TEXT
  )`);

  // Pastores
  db.run(`CREATE TABLE IF NOT EXISTS pastores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    contato TEXT,
    igreja_id INTEGER,
    FOREIGN KEY (igreja_id) REFERENCES igrejas(id)
  )`);

  // Igrejas (com tipo)
  db.run(`CREATE TABLE IF NOT EXISTS igrejas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('Sede', 'Congregação', 'Ponto de Pregação', 'Célula')),
    localizacao TEXT,
    responsavel TEXT,
    contato TEXT
  )`);

  // Finanças
  db.run(`CREATE TABLE IF NOT EXISTS financa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    tipo TEXT,
    categoria TEXT,
    valor REAL,
    observacoes TEXT
  )`);

  // Atividades
  db.run(`CREATE TABLE IF NOT EXISTS atividades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    horario TEXT,
    atividade TEXT,
    local TEXT,
    responsavel TEXT
  )`);
});

module.exports = db;