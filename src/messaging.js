// Módulo de mensajería interna (simple, local)
(function(){
    function openMessagingPanel() {
        // Evitar duplicados
        if (document.getElementById('messagingModal')) {
            document.getElementById('messagingModal').style.display = 'flex';
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'messagingModal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = 10000;

        modal.innerHTML = `
            <div style="width:520px; max-width:95%; background:var(--bg-primary); padding:16px; border-radius:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="margin:0;">Mensajería interna</h3>
                    <button id="closeMessagingBtn" style="background:none;border:none;font-size:18px;cursor:pointer;">✕</button>
                </div>
                <div style="display:flex; gap:12px; margin-bottom:8px;">
                    <input id="msgTo" placeholder="Destinatario (e.g. padre, profesor)" style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:6px;" />
                    <button id="loadMsgsBtn" class="action-btn">Cargar</button>
                </div>
                <div id="messagesList" style="max-height:280px; overflow:auto; border:1px solid var(--border-color); padding:8px; border-radius:6px; background:var(--bg-secondary);"></div>
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <input id="msgText" placeholder="Escribir mensaje..." style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:6px;" />
                    <button id="sendMsgBtn" class="action-btn">Enviar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeMessagingBtn').addEventListener('click', () => modal.remove());

        document.getElementById('loadMsgsBtn').addEventListener('click', () => {
            const to = document.getElementById('msgTo').value.trim();
            loadMessages(to);
        });

        document.getElementById('sendMsgBtn').addEventListener('click', () => {
            const to = document.getElementById('msgTo').value.trim() || 'general';
            const text = document.getElementById('msgText').value.trim();
            if (!text) return alert('Escriba un mensaje');
            sendMessage(to, text);
            document.getElementById('msgText').value = '';
            loadMessages(to);
        });
    }

    function sendMessage(to, text) {
        try {
            const messages = JSON.parse(localStorage.getItem('internalMessages') || '[]');
            messages.unshift({ to, text, from: localStorage.getItem('currentRole') || 'sistema', date: new Date().toISOString() });
            localStorage.setItem('internalMessages', JSON.stringify(messages));
        } catch(e) { console.warn(e); }
    }

    function loadMessages(filterTo) {
        const container = document.getElementById('messagesList');
        if (!container) return;
        let messages = [];
        try { messages = JSON.parse(localStorage.getItem('internalMessages') || '[]'); } catch(e){ messages = []; }
        if (filterTo) messages = messages.filter(m => m.to.toLowerCase().includes(filterTo.toLowerCase()));
        container.innerHTML = messages.map(m => `
            <div style="padding:8px;border-bottom:1px solid var(--border-color);">
                <div style="font-size:13px;color:var(--text-secondary);">${new Date(m.date).toLocaleString('es-ES')} — <strong>${m.from}</strong> → <em>${m.to}</em></div>
                <div style="margin-top:6px;">${m.text}</div>
            </div>
        `).join('') || '<div style="padding:8px;color:var(--text-tertiary);">Sin mensajes</div>';
    }

    window.openMessagingPanel = openMessagingPanel;
    window.sendInternalMessage = sendMessage;
})();
