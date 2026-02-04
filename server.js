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