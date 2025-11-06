// Módulo de notificaciones (simuladas)
(function(){
    function ensureToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.position = 'fixed';
            container.style.right = '16px';
            container.style.bottom = '16px';
            container.style.zIndex = 9999;
            document.body.appendChild(container);
        }
        return container;
    }

    function pushNotificationSimulate(to, message, meta) {
        const container = ensureToastContainer();
        const toast = document.createElement('div');
        toast.className = 'app-toast';
        toast.style.background = '#222';
        toast.style.color = 'white';
        toast.style.padding = '12px 16px';
        toast.style.marginTop = '8px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)';
        toast.style.maxWidth = '320px';
        toast.style.fontSize = '14px';
        toast.innerHTML = `<strong>Notificación a ${to}</strong><div style="margin-top:6px;">${message}</div>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            toast.style.transform = 'translateX(20px)';
            toast.style.opacity = '0';
        }, 2700);

        setTimeout(() => container.removeChild(toast), 3200);

        // También guardar en un registro local para auditoría
        try {
            const logs = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
            logs.unshift({ to, message, meta: meta||{}, date: new Date().toISOString() });
            localStorage.setItem('notificationLogs', JSON.stringify(logs));
        } catch(e) { console.warn(e); }
    }

    // Exponer funciones globalmente para simplicidad
    window.pushNotificationSimulate = pushNotificationSimulate;
})();
