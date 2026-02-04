
// IMPORTANTE: Adicione isso no topo para o servidor entender JSON
app.use(express.json());

// ROTA PARA SALVAR USUÁRIO (Resolve o Erro 404)
app.post('/api/save-user', async (req, res) => {
    try {
        const db = client.db("seu_banco"); // Ajuste o nome do seu banco
        const usuariosColl = db.collection("usuarios");
        const novoUser = req.body;

        // Verifica duplicidade
        const existe = await usuariosColl.findOne({ user: novoUser.user });
        if (existe) return res.status(400).json({ message: "Usuário já existe" });

        await usuariosColl.insertOne(novoUser);
        res.status(200).json({ message: "Usuário criado com sucesso" });
    } catch (e) {
        res.status(500).json({ message: "Erro no servidor" });
    }
});

// ROTA PARA BUSCAR USUÁRIOS (Para o login funcionar)
app.get('/api/usuarios', async (req, res) => {
    try {
        const db = client.db("seu_banco");
        const lista = await db.collection("usuarios").find().toArray();
        res.json(lista);
    } catch (e) {
        res.status(500).send("Erro");
    }
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Configurações iniciais
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CONFIGURAÇÃO DO MONGODB ---
// Usando a sua senha: Freego123
const dbUser = "admin_jirineu";
const dbPass = "Freego123";
const dbName = "jirineu_vendas";
const clusterUrl = "cluster0.cqkouvg.mongodb.net";

const MONGO_URI = `mongodb+srv://${dbUser}:${dbPass}@${clusterUrl}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

// Conectando ao Banco de Dados na Nuvem
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas (Nuvem) com sucesso!"))
    .catch(err => {
        console.error("❌ Erro fatal ao conectar ao MongoDB:");
        console.error(err.message);
    });

// --- DEFINIÇÃO DO MODELO DE DADOS ---
// Isso organiza como as informações serão salvas no banco
const AppDataSchema = new mongoose.Schema({
    chave: { type: String, default: "principal" }, // Identificador único para seus dados
    produtos: { type: Array, default: [] },
    vendas: { type: Array, default: [] },
    configs: { type: Object, default: { valorFixo: 0 } },
    listaCompras: { type: Array, default: [] }
}, { timestamps: true });

const AppData = mongoose.model('AppData', AppDataSchema);

// --- ROTAS DA API ---

// Rota para buscar os dados (GET)
app.get('/api/data', async (req, res) => {
    try {
        const data = await AppData.findOne({ chave: "principal" });
        // Se o banco estiver vazio, retorna um objeto com arrays vazios
        if (!data) {
            return res.json({ produtos: [], vendas: [], configs: { valorFixo: 0 }, listaCompras: [] });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados do servidor" });
    }
});

// Rota para salvar os dados (POST)
app.post('/api/save', async (req, res) => {
    try {
        const { produtos, vendas, configs, listaCompras } = req.body;
        
        // O findOneAndUpdate procura a 'chave: principal' e atualiza os dados. 
        // Se não existir (primeira vez), o 'upsert: true' cria o registro.
        await AppData.findOneAndUpdate(
            { chave: "principal" },
            { produtos, vendas, configs, listaCompras },
            { upsert: true, new: true }
        );
        
        res.json({ status: "success", message: "Dados sincronizados na nuvem!" });
    } catch (err) {
        console.error("Erro ao salvar:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
// A porta será definida pelo servidor online (process.env.PORT) ou será a 3000 localmente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando.`);
    console.log(`📍 Local: http://localhost:${PORT}`);
});
// Rota para salvar novos utilizadores (POST)
app.post('/api/save-user', async (req, res) => {
    try {
        // 1. Conectar ao banco de dados (ajuste o nome do DB para o seu)
        const db = client.db("seu_nome_do_banco");
        const usuariosColl = db.collection("usuarios");

        // 2. Receber os dados enviados pelo front-end
        const { user, pass, tipo, permissoes } = req.body;

        // 3. Validação básica: verificar se o utilizador já existe
        const usuarioExistente = await usuariosColl.findOne({ user: user.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({ message: "Este nome de utilizador já existe!" });
        }

        // 4. Preparar o documento para inserir no MongoDB
        const novoUsuario = {
            user: user.toLowerCase(),
            pass: pass, // Nota: Em produção, o ideal é usar bcrypt para criptografar
            tipo: tipo,
            permissoes: permissoes,
            criadoEm: new Date()
        };

        // 5. Inserir no banco de dados
        await usuariosColl.insertOne(novoUsuario);

        // 6. Responder com sucesso
        res.status(200).json({ message: "Utilizador criado com sucesso!" });

    } catch (error) {
        console.error("Erro ao salvar utilizador:", error);
        res.status(500).json({ message: "Erro interno no servidor ao salvar utilizador." });
    }
});
// Rota para buscar todos os usuários (necessária para validar login de terceiros)
app.get('/api/usuarios', async (req, res) => {
    try {
        const db = client.db("SEU_BANCO_DE_DADOS");
        const users = await db.collection("usuarios").find().toArray();
        res.json(users);
    } catch (e) {
        res.status(500).send("Erro ao buscar usuários");
    }
});

// Rota para salvar novo usuário
app.post('/api/save-user', async (req, res) => {
    try {
        const db = client.db("SEU_BANCO_DE_DADOS");
        const novoUser = req.body;
        
        // Insere no banco MongoDB
        await db.collection("usuarios").insertOne(novoUser);
        res.status(200).send("Criado com sucesso");
    } catch (e) {
        res.status(500).send("Erro ao salvar");
    }
});

