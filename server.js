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

// Conectando ao Banco de Dados
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas com sucesso!"))
    .catch(err => {
        console.error("❌ Erro ao conectar ao MongoDB:", err.message);
    });

// --- MODELO DE DADOS PRINCIPAIS ---
const AppDataSchema = new mongoose.Schema({
    chave: { type: String, default: "principal" },
    produtos: { type: Array, default: [] },
    vendas: { type: Array, default: [] },
    configs: { type: Object, default: { valorFixo: 0 } },
    listaCompras: { type: Array, default: [] }
}, { timestamps: true });

const AppData = mongoose.model('AppData', AppDataSchema);

// --- MODELO DE USUÁRIOS ---
const UsuarioSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    pass: { type: String, required: true },
    tipo: { type: String, default: "restrito" },
    permissoes: { type: Array, default: [] },
    criadoEm: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

// --- ROTAS DA API ---

// 1. Buscar dados principais
app.get('/api/data', async (req, res) => {
    try {
        const data = await AppData.findOne({ chave: "principal" });
        if (!data) {
            return res.json({ produtos: [], vendas: [], configs: { valorFixo: 0 }, listaCompras: [] });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

// 2. Salvar dados principais (Sincronização)
app.post('/api/save', async (req, res) => {
    try {
        const { produtos, vendas, configs, listaCompras } = req.body;
        await AppData.findOneAndUpdate(
            { chave: "principal" },
            { produtos, vendas, configs, listaCompras },
            { upsert: true, new: true }
        );
        res.json({ status: "success", message: "Nuvem atualizada!" });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 3. Buscar todos os usuários (para o Login)
app.get('/api/usuarios', async (req, res) => {
    try {
        const users = await Usuario.find();
        res.json(users);
    } catch (e) {
        res.status(500).send("Erro ao buscar usuários");
    }
});

// 4. Criar Novo Usuário (Configurações)
app.post('/api/save-user', async (req, res) => {
    try {
        const { user, pass, tipo, permissoes } = req.body;

        // Verifica se já existe
        const existe = await Usuario.findOne({ user: user.toLowerCase() });
        if (existe) {
            return res.status(400).json({ message: "Este usuário já existe!" });
        }

        const novoUsuario = new Usuario({
            user: user.toLowerCase(),
            pass: pass,
            tipo: tipo,
            permissoes: permissoes
        });

        await novoUsuario.save();
        res.status(200).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao salvar no banco de dados." });
    }
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
