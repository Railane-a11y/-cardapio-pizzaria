const admin = require('firebase-admin');

// Inicializa a conexão com o banco de dados usando as credenciais fornecidas
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "pizzacontrol-marllon",
      clientEmail: "firebase-adminsdk-fbsvc@pizzacontrol-marllon.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVhik0BKJELMqZ\nLN4S8c51OZXZhugnDuS7XfpNxnk1hpcUL5R3Rdy08rtMxrUVTDdkqosLV8fXDb8Z\nzXHR4A5AcmrGy9tHSZjxrLeKnW1wSs6QVV1dP3xBmuaWMzqSlfMAd815l/vFKIkm\nIZYpNr82aC64dAEHTpfjdMmz7nQVnFl2uUNZe1t8Tuk5KarJ2IV6A0+ILNMmGAJ7\nJr+muL52ZVOALmB76FMsLNbHfEuQVV9ZC6h6rhPOuhD8jMqNYlBO0UqrYeGhm2y4\neb5zhMZtoCfcSIhQhiH9dL0+gqHBlfxgL5ow2xS/SZBhJOZ7GO7DHd6V4BtUoqZf\n+krG1VeNAgMBAAECggEAD7OSJ5ZYpVlC27EyMmPwKeweYhTa0PZ2KPYP8DSyWJaJ\nWQ1npj6vrGm2Dr8E9Wg5oZAt8dtWYXDMFvZl0ohem+weAHjgqtUVZ14rUAjkEZAa\nsP/qAe+ncD6XCsABJGLc7/GfXTvpInYo4bIyE91IAdT27I7xPWuQ3UPLCk10YVtP\nuU3ox5RGFKS/oiV4KupipC9CWNAShEkpH/tBd/I32HqsSV+5O/kcozTW5pElL+it\nC8epxVJHZVIE+TJCZQsgFA9Sr6JwZx7n89CatDNYaU3CEoQsq6Wn625nUIDj4t43\nwTl9o/4kYkL89smcLOPO9KHDHbLec64U8oqH7dfcUQKBgQD7rnwsdklgl3dBsfKa\nahqZXmUVIU2fbigTz403nO76R/L068Wvn8SKs3svDR0JV5MN2xg6VpeWLByCVAeA\n9MBujsR0Y4WGxLib0+8EIftId+t/rKT12P8rP1jZ3IYz+7e3UWkdxpIUqOrEaznh\n+DxlpGhya/vcSRv2rW9lY7PQ8QKBgQDZMBGGu54mq2AURWFbi5poidkVcIfhnYbr\nEFlFkvK4SQhQXhfIa+5q+eI9xXH7vdHD9I6yu75hE+mLJBDsMdSJ8h8LUtY0S1i2\nbVZB2h66QbY7CS4WMCtXT4j/XmqGx2PSKVy+cdAvTZvi6D+4S/0zFN6vDrVEQvEs\nJtnBNKlwXQKBgQDDYAkfDtgZdptqUTROcI2jf2aix46VdBMChf1PLbFKcy4EuT5l\n/nW5Ymj+9oQS63vJpsohB3V3a1jaR1bn4Ze8e3HAFD3kh7Pzq8sA/0wtToJvQ1tv\nSfuT3AIiZZF8qyxLz5P1PF/MT/Cnd8GgTG6+TKmUIYWL1OkzTiGKqKI/UQKBgHPR\n63bDNLqAZ5NH0HxmPSiEYmzJftz1CY7vP/wXOjLGV5WsJ9isng8URO8WDQvnlSZ/\nk12DOyo/2SpnSFL828/Ye2+pdCudBqj6M6aYcAx5oHlpEteoRmSgOHmeWwaW7AeW\nISw6O4AOThQ6MEjS1SrZdUs7d7T4Ue5upW8f6z/NAoGBAO720H8oYk7KZ7UMOTp3\nl+HGNWm8uJhVqqOsE1UBIoom0iBijIs3FvJlnN/LgDVuduFQyBzaMm3HT/Yd23NW\nlIFPSYGL+dK+FKOPzEpVDapIH/a3EtYsfKcCg4Ezpm34Z3n1unyvasiFzlprfFRM\nMRDDCq5FwpJ3sDp0+RZJFC1Z\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    try {
        const dados = JSON.parse(event.body);
        const telefone = dados.telefone.replace(/\D/g, ''); 
        const nome = dados.nome;
        const aniversario = dados.aniversario || null;

        if (!telefone) throw new Error("Telefone é obrigatório");

        const clienteRef = db.collection('fidelidade').doc(telefone);
        const doc = await clienteRef.get();

        let pizzasCompradas = 1;

        if (!doc.exists) {
            await clienteRef.set({
                nome: nome,
                pizzas_compradas: 1,
                data_ultimo_pedido: new Date().toISOString(),
                aniversario: aniversario
            });
            console.log(`Novo cliente cadastrado: ${nome}`);
        } else {
            const dadosCliente = doc.data();
            pizzasCompradas = dadosCliente.pizzas_compradas + 1;
            
            const dadosParaAtualizar = {
                nome: nome,
                pizzas_compradas: pizzasCompradas,
                data_ultimo_pedido: new Date().toISOString()
            };

            if (aniversario) {
                dadosParaAtualizar.aniversario = aniversario;
            }

            await clienteRef.update(dadosParaAtualizar);
            console.log(`Cliente ${nome} atualizado. Total de pizzas: ${pizzasCompradas}`);
        }

        if (pizzasCompradas === 9) {
            console.log("FALTA 1 PIZZA! Acionar WhatsApp em breve...");
        } else if (pizzasCompradas === 10) {
            console.log("GANHOU A PIZZA GRÁTIS! Acionar WhatsApp em breve...");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Sucesso!", total_pizzas: pizzasCompradas })
        };

    } catch (error) {
        console.error("Erro no Firebase:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
