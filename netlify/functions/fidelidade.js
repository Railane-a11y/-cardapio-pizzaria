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

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    try {
        const banco = conectarFirebase(); // Chama a conexão segura
        
        const dados = JSON.parse(event.body);
        const telefone = dados.telefone.replace(/\D/g, ''); 
        const nome = dados.nome;
        const aniversario = dados.aniversario || null;
        const pagamento = dados.pagamento || "";
        
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

            if (dados.comando_whatsapp_original === 'avisar_aniversario') {
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

        return { statusCode: 200, body: JSON.stringify({ message: "Ponto computado com sucesso!" }) };

    } catch (error) {
        console.error("❌ Erro durante o processo:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Erro interno", detalhes: error.message }) };
    }
};
