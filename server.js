const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Configurações iniciais
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CONFIGURAÇÃO DO MONGODB ---
const dbUser = "admin_jirineu";
const dbPass = "Freego123";
const dbName = "jirineu_vendas";
const clusterUrl = "cluster0.cqkouvg.mongodb.net";

const MONGO_URI = `mongodb+srv://${dbUser}:${dbPass}@${clusterUrl}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas (Nuvem) com sucesso!"))
    .catch(err => {
        console.error("❌ Erro fatal ao conectar ao MongoDB:", err.message);
    });

// --- DEFINIÇÃO DOS MODELOS DE DADOS ---

// 1. Modelo para Dados Gerais (Produtos, Vendas, etc)
const AppDataSchema = new mongoose.Schema({
    chave: { type: String, default: "principal" },
    produtos: { type: Array, default: [] },
    vendas: { type: Array, default: [] },
    listaCompras: { type: Array, default: [] },
    config: { type: Object, default: {} },
    lastUpdate: { type: Date, default: Date.now }
});
const AppData = mongoose.model('AppData', AppDataSchema);

// 2. Modelo para Usuários (Isso cria a "tabela" de usuários automaticamente)
const UsuarioSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    pass: { type: String, required: true },
    tipo: { type: String, default: "restrito" },
    permissoes: { type: Array, default: [] },
    criadoEm: { type: Date, default: Date.now }
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);


// --- ROTAS DA API ---

// ROTA: Buscar dados gerais
app.get('/api/data', async (req, res) => {
    try {
        let data = await AppData.findOne({ chave: "principal" });
        if (!data) {
            data = new AppData({ chave: "principal" });
            await data.save();
        }
        res.json(data);
    } catch (err) {
        res.status(500).send("Erro ao buscar dados");
    }
});

// ROTA: Salvar dados gerais (Produtos/Vendas)
app.post('/api/save', async (req, res) => {
    try {
        const { produtos, vendas, listaCompras, config } = req.body;
        await AppData.findOneAndUpdate(
            { chave: "principal" },
            { produtos, vendas, listaCompras, config, lastUpdate: new Date() },
            { upsert: true }
        );
        res.status(200).send("Dados sincronizados com sucesso!");
    } catch (err) {
        res.status(500).send("Erro ao salvar dados");
    }
});

// ROTA: Listar todos os usuários (Usado no Login)
app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar usuários" });
    }
});

// ROTA: Criar Novo Usuário
app.post('/api/save-user', async (req, res) => {
    try {
        const { user, pass, tipo, permissoes } = req.body;

        // Verifica se o usuário já existe
        const existe = await Usuario.findOne({ user: user.toLowerCase().trim() });
        if (existe) {
            return res.status(400).json({ message: "Este utilizador já existe!" });
        }

        const novoUsuario = new Usuario({
            user: user.toLowerCase().trim(),
            pass: pass,
            tipo: tipo || "restrito",
            permissoes: permissoes || []
        });

        await novoUsuario.save();
        res.status(200).json({ message: "Utilizador criado com sucesso!" });

    } catch (error) {
        console.error("Erro ao salvar utilizador:", error);
        res.status(500).json({ message: "Erro interno ao salvar no banco." });
    }
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor a rodar na porta ${PORT}`);
});
