require('dotenv').config(); // Linha necessária para ler o .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Configurações iniciais
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CONFIGURAÇÃO DO MONGODB (MODIFICADO PARA .ENV) ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas (Nuvem) com sucesso!"))
    .catch(err => {
        console.error("❌ Erro fatal ao conectar ao MongoDB:", err.message);
    });

// --- DEFINIÇÃO DOS MODELOS DE DADOS ---

const AppDataSchema = new mongoose.Schema({
    chave: { type: String, required: true, unique: true }, // "principal" ou "visita"
    produtos: { type: Array, default: [] },
    vendas: { type: Array, default: [] },
    listaCompras: { type: Array, default: [] },
    config: { type: Object, default: {} },
    lastUpdate: { type: Date, default: Date.now }
});
const AppData = mongoose.model('AppData', AppDataSchema);

const UsuarioSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    pass: { type: String, required: true },
    tipo: { type: String, default: "restrito" },
    permissoes: { type: Array, default: [] },
    criadoEm: { type: Date, default: Date.now }
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);


// --- ROTAS DA API ATUALIZADAS ---

// ROTA: Buscar dados por CHAVE (carregar principal ou visita)
app.get('/api/load/:chave', async (req, res) => {
    try {
        const { chave } = req.params;
        let data = await AppData.findOne({ chave: chave });
        
        if (!data && chave === "principal") {
            data = new AppData({ chave: "principal" });
            await data.save();
        }
        
        res.json(data || {});
    } catch (err) {
        res.status(500).send("Erro ao buscar dados");
    }
});

// ROTA: Salvar dados por CHAVE (com bloqueio para visita)
app.post('/api/save/:chave', async (req, res) => {
    try {
        const { chave } = req.params;

        if (chave === "visita") {
            return res.status(403).send("Acesso negado: O modo visita não pode alterar o banco de dados.");
        }

        const { produtos, vendas, listaCompras, config } = req.body;
        
        await AppData.findOneAndUpdate(
            { chave: chave },
            { produtos, vendas, listaCompras, config, lastUpdate: new Date() },
            { upsert: true }
        );
        
        res.status(200).send("Dados sincronizados com sucesso!");
    } catch (err) {
        res.status(500).send("Erro ao salvar dados");
    }
});

// ROTA: Listar todos os usuários
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

// ROTA PARA EXCLUIR UTILIZADOR
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id.replace(':', '').trim();
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido formatado" });
        }

        const deletado = await Usuario.findByIdAndDelete(id);
        
        if (!deletado) {
            return res.status(404).json({ message: "Usuário não encontrado no banco" });
        }

        res.status(200).json({ message: "Utilizador removido com sucesso!" });
    } catch (err) {
        console.error("Erro ao excluir:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor a rodar na porta ${PORT}`);
});
