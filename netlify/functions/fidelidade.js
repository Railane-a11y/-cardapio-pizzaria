const admin = require('firebase-admin');

// Variável para manter o banco conectado nas próximas chamadas (evita lentidão)
let db;

function conectarFirebase() {
    if (!db) {
        try {
            if (!admin.apps.length) {
                // Tenta abrir o Cofre da Netlify
                const chaveCofre = process.env.FIREBASE_CREDENTIALS;
                if (!chaveCofre) throw new Error("A variável FIREBASE_CREDENTIALS não foi encontrada na Netlify.");
                
                const serviceAccount = JSON.parse(chaveCofre);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }
            db = admin.firestore();
        } catch (error) {
            console.error("❌ ERRO GRAVE DE CONEXÃO COM FIREBASE:", error.message);
            throw error; // Repassa o erro para o painel de logs
        }
    }
    return db;
}

// ======== CONFIGURAÇÃO DE SEGURANÇA ========
// Coloque aqui o domínio real do seu site na Netlify
const ALLOWED_ORIGINS = [
    'https://cardapiocasadaspizzaass.netlify.app',
    'https://www.cardapiocasadaspizzaass.netlify.app'
    // Adicione seu domínio customizado se tiver, ex: 'https://casadaspizzaass.com.br'
];

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function getCorsHeaders(origin) {
    // Retorna o origin específico se for permitido, senão bloqueia
    const headers = { ...CORS_HEADERS };
    if (ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
}

// ======== RATE LIMIT SIMPLES (por IP, em memória) ========
// Nota: Em serverless, cada cold start reseta o map. É uma proteção parcial,
// mas já impede bursts rápidos dentro da mesma instância.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 5; // Máx 5 requisições por IP por minuto

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    
    if (!entry || (now - entry.start) > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true; // Permitido
    }
    
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return false; // Bloqueado
    }
    return true; // Permitido
}
// =========================================================

exports.handler = async function(event, context) {
    const origin = event.headers.origin || event.headers.Origin || '';
    const headers = getCorsHeaders(origin);

    // Responder preflight CORS (navegador envia OPTIONS antes do POST)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Método não permitido" }) };
    }

    // ======== VERIFICAÇÃO DE ORIGIN ========
    if (!ALLOWED_ORIGINS.includes(origin)) {
        console.warn(`⚠️ Requisição bloqueada de origin não autorizado: ${origin}`);
        return { statusCode: 403, headers, body: JSON.stringify({ error: "Acesso negado" }) };
    }

    // ======== RATE LIMIT ========
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!checkRateLimit(clientIP)) {
        console.warn(`⚠️ Rate limit excedido para IP: ${clientIP}`);
        return { statusCode: 429, headers, body: JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }) };
    }

    try {
        const banco = conectarFirebase(); // Chama a conexão segura
        
        // ======== PARSE SEGURO DO BODY ========
        let dados;
        try {
            dados = JSON.parse(event.body);
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "JSON inválido" }) };
        }

        // ======== VALIDAÇÃO E SANITIZAÇÃO DE INPUT ========
        const telefone = (dados.telefone || '').replace(/\D/g, '');
        const nome = (dados.nome || '').trim().slice(0, 100); // Limita a 100 chars
        const aniversario = dados.aniversario || null;
        const pagamento = dados.pagamento || "";

        // Telefone: deve ter 10 (fixo) ou 11 (celular) dígitos
        if (!telefone || telefone.length < 10 || telefone.length > 11) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Telefone inválido" }) };
        }

        // Nome: pelo menos 2 caracteres
        if (!nome || nome.length < 2) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Nome inválido" }) };
        }

        // Aniversário: validar formato se fornecido (YYYY-MM-DD)
        if (aniversario) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(aniversario)) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Data de nascimento inválida" }) };
            }
            // Bloquear datas futuras
            const dataNasc = new Date(aniversario);
            const hoje = new Date();
            if (isNaN(dataNasc.getTime()) || dataNasc > hoje) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Data de nascimento não pode ser no futuro" }) };
            }
            // Validar idade razoável (10–120 anos)
            const idade = (hoje - dataNasc) / (365.25 * 24 * 60 * 60 * 1000);
            if (idade < 10 || idade > 120) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Data de nascimento fora da faixa válida" }) };
            }
        }

        // Pagamento: deve ser um valor esperado (se informado)
        if (pagamento && !['pix', 'dinheiro'].includes(pagamento)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Forma de pagamento inválida" }) };
        }

        // Comando WhatsApp: sanitizar — só aceitar valores esperados
        let comandoOriginal = dados.comando_whatsapp_original || null;
        if (comandoOriginal && comandoOriginal !== 'avisar_aniversario') {
            comandoOriginal = null; // Descarta qualquer valor inesperado
        }
        // ==============================================

        let hojeStr = new Date().toISOString().split('T')[0];
        const clienteRef = banco.collection('fidelidade').doc(telefone);

        // Transação Atômica (Anti-Dedo Nervoso)
        await banco.runTransaction(async (transaction) => {
            const doc = await transaction.get(clienteRef);
            
            let dadosCliente = doc.exists ? doc.data() : {};
            let pizzasCompradas = dadosCliente.pizzas_compradas || 0;
            let premioDisponivel = dadosCliente.premio_disponivel || false;
            let validadePremio = dadosCliente.validade_premio || null;
            let ultimoParabens = dadosCliente.ultimo_parabens_data || null;
            
            let acaoWhatsApp = null;

            if (comandoOriginal === 'avisar_aniversario') {
                if (ultimoParabens !== hojeStr) {
                    ultimoParabens = hojeStr;
                    acaoWhatsApp = 'avisar_aniversario';
                }
            }

            if (pagamento === 'pix') {
                pizzasCompradas += 1; 
                
                if (pizzasCompradas === 1) {
                    acaoWhatsApp = (acaoWhatsApp === 'avisar_aniversario') ? 'combo_boas_vindas_aniversario' : 'avisar_boas_vindas';
                } else if (pizzasCompradas === 9) {
                    acaoWhatsApp = 'avisar_falta_uma';
                } else if (pizzasCompradas === 10) {
                    acaoWhatsApp = 'avisar_ganhou';
                    pizzasCompradas = 0; 
                    premioDisponivel = true;
                    const dataValidade = new Date();
                    dataValidade.setDate(dataValidade.getDate() + 15);
                    validadePremio = dataValidade.toISOString().split('T')[0];
                } else {
                    acaoWhatsApp = 'confirmar_ponto';
                }
            }

            const dadosParaAtualizar = {
                nome: nome,
                pizzas_compradas: pizzasCompradas,
                premio_disponivel: premioDisponivel,
                validade_premio: validadePremio,
                data_ultimo_pedido: new Date().toISOString()
            };

            if (aniversario) dadosParaAtualizar.aniversario = aniversario;
            if (acaoWhatsApp) dadosParaAtualizar.comando_whatsapp = acaoWhatsApp;
            if (ultimoParabens) dadosParaAtualizar.ultimo_parabens_data = ultimoParabens;

            transaction.set(clienteRef, dadosParaAtualizar, { merge: true });
        });

        return { statusCode: 200, headers, body: JSON.stringify({ message: "Ponto computado com sucesso!" }) };

    } catch (error) {
        console.error("❌ Erro durante o processo:", error);
        // SEGURANÇA: Não expor detalhes do erro ao cliente
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Erro interno do servidor" }) };
    }
};
