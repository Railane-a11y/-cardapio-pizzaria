// Scripts para inicializar o Firebase
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js" );
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js" );

// Sua configuração pessoal do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyArFnFmJ5k3lB7-wbRmpzlrrDoq6jrTqxU",
  authDomain: "casadaspizzaass-c25ee.firebaseapp.com",
  projectId: "casadaspizzaass-c25ee",
  storageBucket: "casadaspizzaass-c25ee.appspot.com", // Corrigi para o formato correto
  messagingSenderId: "370746157871",
  appId: "1:370746157871:web:24980faf10a5b566a94fda"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Este código gerencia as notificações quando o app está em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Ícone que aparece na notificação
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
